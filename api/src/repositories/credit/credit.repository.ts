import { Knex } from 'knex';
import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { Member, Transaction, TransactionReason, Wallet } from '../../types/models';

/** CityCash and experience granted by a single credit. */
export interface CreditAmount {
  /** CityCash added to the member's wallet. */
  cc: number;
  /** Experience points added to the member. */
  xp: number;
}

/** What a payout attempt did. */
export interface CreditOutcome {
  /**
   * `true` when this call is the one that paid. `false` means the member was not
   * eligible when the row was actually held - already credited, or holding no earning
   * role - and nothing was written.
   */
  credited: boolean;
  /** Amounts paid. Only present when `credited`. */
  amount?: CreditAmount;
  /** Role the weekly payment was made for. Only present on a weekly credit. */
  roleId?: number;
}

/**
 * Restricts a role join to roles that actually earn: ones paying CityCash, XP, or both.
 *
 * A role paying neither is not a job. Payroll's inner join used to exist only to ask
 * "does this member hold any role at all", so an Admin assignment - seeded at 0 CityCash
 * and 0 XP - qualified its holder, took a slot in the capped batch, produced a
 * zero-value ledger row, and got the eligibility timestamp stamped.
 *
 * The two income columns are independent, so the predicate is "pays CityCash OR pays XP",
 * never CityCash alone: filtering on CityCash would stop an XP-only role ever accruing
 * its XP. Applied to eligibility and to role selection alike, so a member cannot be
 * selected on one role and paid for another.
 *
 * Shared with RoleAssignmentRepository, which asks the same question when it picks the
 * batch.
 * @param builder grouped-where builder supplied by knex
 */
export function wherePayingRole(builder: Knex.QueryBuilder): void {
  builder.where('role.income_cc', '>', 0).orWhere('role.income_xp', '>', 0);
}

/**
 * Whether a member has already had their daily login bonus since the beginning
 * (00:00:00) of the current day.
 *
 * Lives here rather than on MemberService because the check that decides whether money
 * moves has to run inside the transaction that moves it. MemberService keeps a method
 * of the same name, delegating here, so both answer identically.
 */
export function hasReceivedDailyCreditToday(lastCredit: Date, now: Date = new Date()): boolean {
  return lastCredit.getTime() >= new Date(now).setHours(0, 0, 0, 0);
}

/**
 * Repository owning the two job-credit payouts, each as a single database transaction.
 *
 * Both payouts move four things that have to agree: a wallet balance, a ledger row, the
 * member's XP, and the eligibility timestamp that decides whether the payout may happen
 * again. Splitting them across transactions is what let a failed second half leave money
 * moved with the member still eligible, and reading eligibility outside the transaction
 * that pays is what let two callers both decide to pay.
 *
 * So every method here follows the same shape:
 *
 *   1. lock the member row with SELECT ... FOR UPDATE;
 *   2. re-evaluate eligibility against the locked row, not against anything a caller
 *      passed in or a batch query read earlier;
 *   3. write wallet, ledger, XP and timestamp;
 *   4. commit.
 *
 * A second caller arriving concurrently blocks at step 1, and a locking read returns the
 * latest committed row rather than the transaction's snapshot, so it sees the first
 * caller's timestamp at step 2 and becomes a no-op. Wallet balances are moved with
 * `balance = balance + ?` rather than a read followed by a write of the total, so a
 * credit landing on a wallet another transaction is also crediting cannot overwrite it.
 *
 * The member row is always the first row locked, so these paths cannot deadlock against
 * each other.
 */
@Service()
export class CreditRepository {
  constructor(private db: Db) {}

  /**
   * Gives the member their daily login bonus, unless they have already had it today.
   * @param memberId id of the member to credit
   * @param amounts amounts to award, by whether the member holds any role
   * @returns what was paid, or `credited: false` if the bonus had already been given
   */
  public async giveDailyCredit(
    memberId: number,
    amounts: { unemployed: CreditAmount; employed: CreditAmount },
  ): Promise<CreditOutcome> {
    return this.db.knex.transaction(async trx => {
      const member = await this.lockMember(trx, memberId);
      if (!member) return { credited: false };
      if (hasReceivedDailyCreditToday(member.last_daily_login_credit)) {
        return { credited: false };
      }

      // Holding any role at all is what counts as employed for the daily bonus,
      // including a role that pays nothing. That is existing policy, unchanged here -
      // the earning-role filter belongs to weekly payroll, not to this.
      const [{ roles }] = await trx('role_assignment')
        .where('member_id', memberId)
        .count({ roles: '*' });
      const amount = Number(roles) > 0 ? amounts.employed : amounts.unemployed;

      await this.pay(trx, member.wallet_id, amount.cc, TransactionReason.DailyCredit);
      await trx<Member>('member')
        .where({ id: memberId })
        .update({
          xp: trx.raw('xp + ?', [amount.xp]),
          last_daily_login_credit: new Date(),
        });

      return { credited: true, amount };
    });
  }

  /**
   * Pays a member for one week of the highest-paying role they hold, unless they have
   * already been paid today or hold no earning role.
   *
   * Takes only an id: the batch query that produced it read the member's XP, wallet and
   * roles before any lock was held, and none of that is authoritative by the time the
   * money moves. Everything the payout needs is re-read here, under the lock.
   * @param memberId id of the member to pay
   * @returns what was paid, or `credited: false` if the member was not due pay
   */
  public async giveWeeklyRoleCredit(memberId: number): Promise<CreditOutcome> {
    return this.db.knex.transaction(async trx => {
      const member = await this.lockMemberDueWeeklyCredit(trx, memberId);
      if (!member || !member.due) return { credited: false };

      // One role, not every role held: paying a citizen for a single job is the
      // behaviour established when single pay landed, and is preserved here.
      const role = await trx('role_assignment')
        .select('role_assignment.role_id', 'role.income_cc', 'role.income_xp')
        .innerJoin('role', 'role_assignment.role_id', 'role.id')
        .where('role_assignment.member_id', memberId)
        .where(wherePayingRole)
        // Highest CityCash wins; among roles paying the same CityCash, the one granting
        // more XP wins rather than whichever row the database happened to return first.
        .orderBy('role.income_cc', 'desc')
        .orderBy('role.income_xp', 'desc')
        .first();
      if (!role) return { credited: false };

      const amount: CreditAmount = { cc: role.income_cc, xp: role.income_xp };
      await this.pay(
        trx,
        member.wallet_id,
        amount.cc,
        `${TransactionReason.WeeklyCredit} for ${role.role_id}`,
      );
      await trx<Member>('member')
        .where({ id: memberId })
        .update({
          xp: trx.raw('xp + ?', [amount.xp]),
          // Stamped from the database clock, because the predicate that reads it back is
          // also evaluated there. A JS timestamp would open a double-pay window whenever
          // the API and the database disagree about the date.
          last_weekly_role_credit: trx.fn.now(),
        });

      return { credited: true, amount, roleId: role.role_id };
    });
  }

  /**
   * Locks a member row and answers, in the same statement, whether they are due weekly
   * pay.
   *
   * One statement rather than a lock followed by a separate check, so that the answer
   * cannot come from a different point in time than the lock. Under REPEATABLE READ a
   * plain SELECT reads the transaction's snapshot rather than the latest committed row,
   * which is exactly the mistake this method exists to avoid making.
   *
   * The three conditions are deliberately the ones the batch query selects on, evaluated
   * by the database so that "today" and "within the last seven days" mean the same thing
   * in both places.
   */
  private async lockMemberDueWeeklyCredit(
    trx: Knex.Transaction,
    memberId: number,
  ): Promise<{ wallet_id: number; due: number }> {
    return trx('member')
      .select('wallet_id')
      .select(trx.raw(
        `status = 1
           AND DATE(last_weekly_role_credit) <> DATE(NOW())
           AND DATE(last_daily_login_credit) >= DATE(NOW() - INTERVAL 7 DAY) AS due`,
      ))
      .where({ id: memberId })
      .forUpdate()
      .first();
  }

  /**
   * Locks a member row for the life of the transaction.
   *
   * A locking read, so it returns the latest committed row rather than the snapshot the
   * transaction started with - which is what makes the eligibility recheck that follows
   * it see a concurrent payout that has already committed.
   */
  private async lockMember(trx: Knex.Transaction, memberId: number): Promise<Member> {
    return trx<Member>('member').where({ id: memberId }).forUpdate().first();
  }

  /**
   * Moves CityCash into a wallet and records it in the ledger.
   *
   * `increment` emits `balance = balance + ?`, so the new balance is computed by the
   * database from whatever is committed at that moment. Reading the balance and writing
   * back `read + amount` instead is what let one of two concurrent credits vanish.
   *
   * The ledger row is written even when the amount is zero: an XP-only role still earns
   * a weekly credit, and the row is the only record that it happened.
   */
  private async pay(
    trx: Knex.Transaction,
    walletId: number,
    amount: number,
    reason: string,
  ): Promise<void> {
    await trx<Wallet>('wallet').where({ id: walletId }).increment('balance', amount);
    await trx<Transaction>('transaction').insert({
      amount,
      reason,
      recipient_wallet_id: walletId,
    });
  }
}
