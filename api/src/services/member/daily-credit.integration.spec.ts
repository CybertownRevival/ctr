import bcrypt from 'bcrypt';
import { Container } from 'typedi';

import { Db } from '../../db/db.class';
import { MemberService } from './member.service';
import {
  assignRole,
  cleanUpFixtures,
  createMember,
  createRole,
  daysAgo,
  describeWithDb,
  fixtureName,
  MemberFixture,
} from '@spec/integration-db';

/**
 * The daily login credit, against a real MySQL.
 *
 * The interesting questions are all about what the database ends up holding: whether two
 * logins arriving together pay once or twice, whether a failure part way through leaves
 * money moved, and whether a credit landing at the same moment as the weekly payroll can
 * overwrite it. None of those can be answered by a mocked query builder.
 *
 * Requires the explicit disposable-database opt-in described in `spec/integration-db.ts`,
 * and `--runInBand`: these specs read and write the shared `member` table.
 */
describeWithDb('daily login credit (real database)', () => {
  const knex = Container.get(Db).knex;
  const service = Container.get(MemberService);

  /** The amounts are economy policy and deliberately hard-coded: B1 must not move them. */
  const UNEMPLOYED_CC = 50;
  const UNEMPLOYED_XP = 5;
  const EMPLOYED_CC = 100;
  const EMPLOYED_XP = 10;

  /** A member who has not been credited today, and so is due the bonus. */
  async function createDueMember(overrides: Record<string, unknown> = {}) {
    return createMember(knex, {
      last_daily_login_credit: daysAgo(1),
      last_weekly_role_credit: new Date(),
      xp: 0,
      ...overrides,
    });
  }

  async function balanceOf(member: MemberFixture): Promise<number> {
    const wallet = await knex('wallet').where({ id: member.walletId }).first();
    return wallet.balance;
  }

  async function memberRow(member: MemberFixture) {
    return knex('member').where({ id: member.id }).first();
  }

  async function dailyLedgerRows(member: MemberFixture) {
    return knex('transaction')
      .where({ recipient_wallet_id: member.walletId, reason: 'daily-credit' });
  }

  /** True when the member's eligibility timestamp has been moved to today. */
  async function stampedToday(member: MemberFixture): Promise<boolean> {
    const [rows] = await knex.raw(
      'SELECT DATE(last_daily_login_credit) = DATE(NOW()) AS credited_today '
      + 'FROM member WHERE id = ?',
      [member.id],
    );
    return Boolean(rows[0].credited_today);
  }

  beforeEach(async () => {
    await cleanUpFixtures(knex);
  });

  afterEach(async () => {
    await cleanUpFixtures(knex);
  });

  afterAll(async () => {
    await knex.destroy();
  });

  describe('amounts', () => {
    it('credits an unemployed member the standard amount, once', async () => {
      const member = await createDueMember();

      await service.maybeGiveDailyCredits(member.id);

      expect(await balanceOf(member)).toBe(1000 + UNEMPLOYED_CC);
      expect((await memberRow(member)).xp).toBe(UNEMPLOYED_XP);
      expect(await dailyLedgerRows(member)).toHaveLength(1);
      expect(await stampedToday(member)).toBe(true);
    });

    it('credits the employed amount to anyone holding a role, including one that pays nothing',
      async () => {
        const member = await createDueMember();
        await assignRole(knex, member.id, await createRole(knex, {
          name: fixtureName('AdminOnly'),
          income_cc: 0,
          income_xp: 0,
        }));

        await service.maybeGiveDailyCredits(member.id);

        expect(await balanceOf(member)).toBe(1000 + EMPLOYED_CC);
        expect((await memberRow(member)).xp).toBe(EMPLOYED_XP);
      });

    it('is a no-op for a member already credited today', async () => {
      const member = await createDueMember({ last_daily_login_credit: new Date() });

      await service.maybeGiveDailyCredits(member.id);

      expect(await balanceOf(member)).toBe(1000);
      expect(await dailyLedgerRows(member)).toHaveLength(0);
    });
  });

  describe('login', () => {
    const password = 'b1-correct-horse';

    async function createLoginMember(): Promise<MemberFixture> {
      return createDueMember({ password: await bcrypt.hash(password, 10) });
    }

    it('has already applied the credit by the time it returns a token', async () => {
      const member = await createLoginMember();

      const token = await service.login(member.username, password);

      expect(typeof token).toBe('string');
      expect(await balanceOf(member)).toBe(1000 + UNEMPLOYED_CC);
    });

    describe('when the credit cannot be applied', () => {
      afterEach(async () => {
        await knex.raw('DROP TRIGGER IF EXISTS b1_block_member_update');
      });

      async function failMemberUpdatesFor(memberId: number): Promise<void> {
        await knex.raw('DROP TRIGGER IF EXISTS b1_block_member_update');
        await knex.raw(
          `CREATE TRIGGER b1_block_member_update BEFORE UPDATE ON member FOR EACH ROW
           BEGIN
             IF NEW.id = ${memberId} THEN
               SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'b1 injected member update failure';
             END IF;
           END`,
        );
      }

      it('still logs the member in', async () => {
        const member = await createLoginMember();
        await failMemberUpdatesFor(member.id);

        const token = await service.login(member.username, password);

        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
      });

      it('leaves no half-applied credit behind', async () => {
        const member = await createLoginMember();
        await failMemberUpdatesFor(member.id);

        await service.login(member.username, password);
        // Long enough for a credit that was never awaited to land anyway.
        await new Promise(resolve => setTimeout(resolve, 500));

        expect(await balanceOf(member)).toBe(1000);
        expect(await dailyLedgerRows(member)).toHaveLength(0);
        expect(await stampedToday(member)).toBe(false);
      });
    });
  });

  describe('concurrency', () => {
    /** See the equivalent note in `role-credit.integration.spec.ts`. */
    beforeEach(async () => {
      await knex.raw('DROP TRIGGER IF EXISTS b1_slow_wallet_update');
      await knex.raw(
        'CREATE TRIGGER b1_slow_wallet_update BEFORE UPDATE ON wallet '
        + 'FOR EACH ROW SET @b1_slow = SLEEP(0.4)',
      );
    });

    afterEach(async () => {
      await knex.raw('DROP TRIGGER IF EXISTS b1_slow_wallet_update');
    });

    it('credits once when two logins arrive together', async () => {
      const member = await createDueMember();

      await Promise.all([
        service.maybeGiveDailyCredits(member.id),
        service.maybeGiveDailyCredits(member.id),
      ]);

      expect(await balanceOf(member)).toBe(1000 + UNEMPLOYED_CC);
      expect((await memberRow(member)).xp).toBe(UNEMPLOYED_XP);
      expect(await dailyLedgerRows(member)).toHaveLength(1);
    }, 30000);

    it('does not lose a wallet update when the weekly payroll credits the same wallet',
      async () => {
        const runRoleCreditCron: () => Promise<void> = jest.requireActual('../../cron/role-credit');
        const weeklyCc = 50;
        const weeklyXp = 5;
        const member = await createDueMember({ last_weekly_role_credit: daysAgo(7) });
        await assignRole(knex, member.id, await createRole(knex, {
          name: fixtureName('RealWorker'),
          income_cc: weeklyCc,
          income_xp: weeklyXp,
        }));

        await Promise.all([
          service.maybeGiveDailyCredits(member.id),
          runRoleCreditCron(),
        ]);

        expect(await balanceOf(member)).toBe(1000 + EMPLOYED_CC + weeklyCc);
        expect((await memberRow(member)).xp).toBe(EMPLOYED_XP + weeklyXp);
      }, 30000);
  });

  describe('rollback', () => {
    afterEach(async () => {
      await knex.raw('DROP TRIGGER IF EXISTS b1_block_member_update');
      await knex.raw('DROP TRIGGER IF EXISTS b1_block_ledger_insert');
    });

    async function failMemberUpdatesFor(memberId: number): Promise<void> {
      await knex.raw(
        `CREATE TRIGGER b1_block_member_update BEFORE UPDATE ON member FOR EACH ROW
         BEGIN
           IF NEW.id = ${memberId} THEN
             SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'b1 injected member update failure';
           END IF;
         END`,
      );
    }

    it('moves no money when the member half of the credit fails', async () => {
      const member = await createDueMember();
      await failMemberUpdatesFor(member.id);

      await expect(service.maybeGiveDailyCredits(member.id)).rejects.toThrow();

      expect(await balanceOf(member)).toBe(1000);
      expect(await dailyLedgerRows(member)).toHaveLength(0);
      expect((await memberRow(member)).xp).toBe(0);
      expect(await stampedToday(member)).toBe(false);
    });

    it('leaves the member untouched when the ledger half of the credit fails', async () => {
      const member = await createDueMember();
      await knex.raw(
        `CREATE TRIGGER b1_block_ledger_insert BEFORE INSERT ON transaction FOR EACH ROW
         BEGIN
           IF NEW.recipient_wallet_id = ${member.walletId} THEN
             SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'b1 injected ledger failure';
           END IF;
         END`,
      );

      await expect(service.maybeGiveDailyCredits(member.id)).rejects.toThrow();

      expect(await balanceOf(member)).toBe(1000);
      expect((await memberRow(member)).xp).toBe(0);
      expect(await stampedToday(member)).toBe(false);
    });

    it('credits exactly once when the attempt is retried after that failure', async () => {
      const member = await createDueMember();
      await failMemberUpdatesFor(member.id);
      await expect(service.maybeGiveDailyCredits(member.id)).rejects.toThrow();

      await knex.raw('DROP TRIGGER IF EXISTS b1_block_member_update');
      await service.maybeGiveDailyCredits(member.id);

      expect(await balanceOf(member)).toBe(1000 + UNEMPLOYED_CC);
      expect(await dailyLedgerRows(member)).toHaveLength(1);
      expect((await memberRow(member)).xp).toBe(UNEMPLOYED_XP);
    });
  });
});
