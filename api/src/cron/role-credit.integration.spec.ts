import { Container } from 'typedi';

import { Db } from '../db/db.class';
import { RoleAssignmentService } from '../services';
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
 * Weekly job pay, exercised end to end through the cron that actually runs it, against a
 * real MySQL.
 *
 * Everything under test here is about a database's behaviour rather than a service's:
 * which rows a predicate selects, whether two writes land in one transaction, and what
 * two workers racing each other leave behind. A mocked query builder can assert that a
 * predicate was *written*; only a database can say what it *selects*, and no mock can
 * fail a transaction half way through and show what survived.
 *
 * Requires the explicit disposable-database opt-in described in `spec/integration-db.ts`,
 * and `--runInBand`: these specs read and write the shared `member` table.
 */
describeWithDb('weekly role credit (real database)', () => {
  const db = Container.get(Db);
  const knex = db.knex;
  /** The cron module is the production entry point, and takes no arguments. */
  const runRoleCreditCron: () => Promise<void> = jest.requireActual('./role-credit');

  /** A member who is due weekly pay: paid last week, and active within the last seven days. */
  async function createDueMember(): Promise<MemberFixture> {
    return createMember(knex, {
      last_weekly_role_credit: daysAgo(7),
      last_daily_login_credit: new Date(),
      xp: 0,
    });
  }

  async function balanceOf(member: MemberFixture): Promise<number> {
    const wallet = await knex('wallet').where({ id: member.walletId }).first();
    return wallet.balance;
  }

  async function memberRow(member: MemberFixture) {
    return knex('member').where({ id: member.id }).first();
  }

  async function weeklyLedgerRows(member: MemberFixture) {
    return knex('transaction')
      .where({ recipient_wallet_id: member.walletId })
      .andWhere('reason', 'like', 'weekly-role-credit%');
  }

  /** True when the member's eligibility timestamp has been moved to today. */
  async function stampedToday(member: MemberFixture): Promise<boolean> {
    const [rows] = await knex.raw(
      'SELECT DATE(last_weekly_role_credit) = DATE(NOW()) AS paid_today FROM member WHERE id = ?',
      [member.id],
    );
    return Boolean(rows[0].paid_today);
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

  describe('eligibility', () => {
    it('does not pay, or stamp, a member whose only role pays nothing', async () => {
      const member = await createDueMember();
      await assignRole(knex, member.id, await createRole(knex, {
        name: fixtureName('AdminOnly'),
        income_cc: 0,
        income_xp: 0,
      }));

      await runRoleCreditCron();

      expect(await balanceOf(member)).toBe(1000);
      expect((await memberRow(member)).xp).toBe(0);
      expect(await weeklyLedgerRows(member)).toHaveLength(0);
      expect(await stampedToday(member)).toBe(false);
    });

    it('pays a role that grants CityCash but no XP', async () => {
      const member = await createDueMember();
      await assignRole(knex, member.id, await createRole(knex, {
        name: fixtureName('CcOnly'),
        income_cc: 40,
        income_xp: 0,
      }));

      await runRoleCreditCron();

      expect(await balanceOf(member)).toBe(1040);
      expect((await memberRow(member)).xp).toBe(0);
      expect(await weeklyLedgerRows(member)).toHaveLength(1);
      expect(await stampedToday(member)).toBe(true);
    });

    it('pays a role that grants XP but no CityCash', async () => {
      const member = await createDueMember();
      await assignRole(knex, member.id, await createRole(knex, {
        name: fixtureName('XpOnly'),
        income_cc: 0,
        income_xp: 7,
      }));

      await runRoleCreditCron();

      expect(await balanceOf(member)).toBe(1000);
      expect((await memberRow(member)).xp).toBe(7);
      expect(await weeklyLedgerRows(member)).toHaveLength(1);
      expect(await stampedToday(member)).toBe(true);
    });

    it('leaves a member who was already paid today alone', async () => {
      const member = await createMember(knex, {
        last_weekly_role_credit: new Date(),
        last_daily_login_credit: new Date(),
        xp: 0,
      });
      await assignRole(knex, member.id, await createRole(knex, {
        name: fixtureName('RealWorker'),
        income_cc: 50,
        income_xp: 5,
      }));

      await runRoleCreditCron();

      expect(await balanceOf(member)).toBe(1000);
      expect(await weeklyLedgerRows(member)).toHaveLength(0);
    });
  });

  describe('single-pay role selection', () => {
    it('pays the earning role, not the one that pays nothing', async () => {
      const member = await createDueMember();
      const worker = await createRole(knex, {
        name: fixtureName('RealWorker'),
        income_cc: 50,
        income_xp: 5,
      });
      await assignRole(knex, member.id, await createRole(knex, {
        name: fixtureName('AdminOnly'),
        income_cc: 0,
        income_xp: 0,
      }));
      await assignRole(knex, member.id, worker);

      await runRoleCreditCron();

      const ledger = await weeklyLedgerRows(member);
      expect(ledger).toHaveLength(1);
      expect(ledger[0].reason).toBe(`weekly-role-credit for ${worker}`);
      expect(await balanceOf(member)).toBe(1050);
      expect((await memberRow(member)).xp).toBe(5);
    });

    it('breaks a CityCash tie on XP, and still pays only once', async () => {
      const member = await createDueMember();
      const lowXp = await createRole(knex, {
        name: fixtureName('EqualCcLowXp'),
        income_cc: 60,
        income_xp: 1,
      });
      const highXp = await createRole(knex, {
        name: fixtureName('EqualCcHighXp'),
        income_cc: 60,
        income_xp: 9,
      });
      await assignRole(knex, member.id, lowXp);
      await assignRole(knex, member.id, highXp);

      await runRoleCreditCron();

      const ledger = await weeklyLedgerRows(member);
      expect(ledger).toHaveLength(1);
      expect(ledger[0].reason).toBe(`weekly-role-credit for ${highXp}`);
      expect(await balanceOf(member)).toBe(1060);
      expect((await memberRow(member)).xp).toBe(9);
    });

    it('pays a place-scoped assignment exactly as it pays an unscoped one', async () => {
      const unscoped = await createDueMember();
      const scoped = await createDueMember();
      const role = await createRole(knex, {
        name: fixtureName('PlaceScoped'),
        income_cc: 50,
        income_xp: 5,
      });
      await assignRole(knex, unscoped.id, role, null);
      await assignRole(knex, scoped.id, role, 1);

      await runRoleCreditCron();

      expect(await balanceOf(unscoped)).toBe(1050);
      expect(await balanceOf(scoped)).toBe(1050);
      expect((await memberRow(scoped)).xp).toBe(5);
    });
  });

  describe('batch limit', () => {
    it('fills the batch with earning members rather than with non-earning ones', async () => {
      const nothing = await createRole(knex, {
        name: fixtureName('AdminOnly'),
        income_cc: 0,
        income_xp: 0,
      });
      const worker = await createRole(knex, {
        name: fixtureName('RealWorker'),
        income_cc: 50,
        income_xp: 5,
      });
      const nonEarners: MemberFixture[] = [];
      for (let index = 0; index < 3; index += 1) {
        const member = await createDueMember();
        await assignRole(knex, member.id, nothing);
        nonEarners.push(member);
      }
      const earners: MemberFixture[] = [];
      for (let index = 0; index < 2; index += 1) {
        const member = await createDueMember();
        await assignRole(knex, member.id, worker);
        earners.push(member);
      }

      const selected = await Container.get(RoleAssignmentService).getMembersDueRoleCredit(2);

      expect(selected).toHaveLength(2);
      expect(selected.sort()).toEqual(earners.map(member => member.id).sort());
      for (const member of nonEarners) {
        expect(selected).not.toContain(member.id);
      }
    });
  });

  describe('concurrency', () => {
    /**
     * Slows every wallet update down, so that two payouts starting together are
     * guaranteed to overlap rather than merely likely to. Without it the race is real
     * but timing-dependent, and a green run would prove nothing.
     */
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

    it('pays exactly once when two cron executions overlap', async () => {
      const member = await createDueMember();
      await assignRole(knex, member.id, await createRole(knex, {
        name: fixtureName('RealWorker'),
        income_cc: 50,
        income_xp: 5,
      }));

      await Promise.all([runRoleCreditCron(), runRoleCreditCron()]);

      expect(await balanceOf(member)).toBe(1050);
      expect((await memberRow(member)).xp).toBe(5);
      expect(await weeklyLedgerRows(member)).toHaveLength(1);
    }, 30000);
  });

  describe('rollback', () => {
    /**
     * Fails the member half of the payout at the database, leaving the wallet and ledger
     * half untouched by the injection. If the two halves commit independently, the money
     * moves and the member stays eligible to be paid again.
     */
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

    /**
     * Fails the ledger half instead, so the two halves are proven to depend on each
     * other in both directions rather than only in the one the implementation happens
     * to write first.
     */
    async function failLedgerWritesFor(walletId: number): Promise<void> {
      await knex.raw('DROP TRIGGER IF EXISTS b1_block_ledger_insert');
      await knex.raw(
        `CREATE TRIGGER b1_block_ledger_insert BEFORE INSERT ON transaction FOR EACH ROW
         BEGIN
           IF NEW.recipient_wallet_id = ${walletId} THEN
             SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'b1 injected ledger failure';
           END IF;
         END`,
      );
    }

    afterEach(async () => {
      await knex.raw('DROP TRIGGER IF EXISTS b1_block_member_update');
      await knex.raw('DROP TRIGGER IF EXISTS b1_block_ledger_insert');
    });

    it('leaves the member untouched when the ledger half of the payout fails', async () => {
      const member = await createDueMember();
      await assignRole(knex, member.id, await createRole(knex, {
        name: fixtureName('RealWorker'),
        income_cc: 50,
        income_xp: 5,
      }));
      await failLedgerWritesFor(member.walletId);

      await expect(runRoleCreditCron()).rejects.toThrow();

      expect(await balanceOf(member)).toBe(1000);
      expect((await memberRow(member)).xp).toBe(0);
      expect(await stampedToday(member)).toBe(false);
    });

    it('leaves no money moved when the member half of the payout fails', async () => {
      const member = await createDueMember();
      await assignRole(knex, member.id, await createRole(knex, {
        name: fixtureName('RealWorker'),
        income_cc: 50,
        income_xp: 5,
      }));
      await failMemberUpdatesFor(member.id);

      await expect(runRoleCreditCron()).rejects.toThrow();

      expect(await balanceOf(member)).toBe(1000);
      expect(await weeklyLedgerRows(member)).toHaveLength(0);
      expect((await memberRow(member)).xp).toBe(0);
      expect(await stampedToday(member)).toBe(false);
    });

    it('does not pay twice when the run is retried after that failure', async () => {
      const member = await createDueMember();
      await assignRole(knex, member.id, await createRole(knex, {
        name: fixtureName('RealWorker'),
        income_cc: 50,
        income_xp: 5,
      }));
      await failMemberUpdatesFor(member.id);
      await expect(runRoleCreditCron()).rejects.toThrow();

      await knex.raw('DROP TRIGGER IF EXISTS b1_block_member_update');
      await runRoleCreditCron();

      expect(await balanceOf(member)).toBe(1050);
      expect(await weeklyLedgerRows(member)).toHaveLength(1);
      expect((await memberRow(member)).xp).toBe(5);
    });
  });
});
