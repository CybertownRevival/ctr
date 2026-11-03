import { Knex } from 'knex';
import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { CountRow } from '../row.types';
import { Member, Transaction, TransactionReason, Wallet } from '../../types/models';

/**
 * A transaction row as the admin pages consume it: the stored columns plus the
 * usernames `AdminService` resolves onto them after the query.
 */
export interface TransactionRow extends Transaction {
  recipient_username?: Pick<Member, 'username'>[];
  sender_username?: Pick<Member, 'username'>[];
}

/** Repository for creating/interacting with transaction/wallet data in the database. */
@Service()
export class TransactionRepository {
  constructor(private db: Db) {}

  /**
   * Applies the given amount to the balance for the wallet with the given id, and creates
   * a transaction record.
   * @param walletId id of recipient wallet
   * @param amount amount transacted
   * @returns promise resolving in the created transaction object, or rejecting on error
   */
  public async createDailyCreditTransaction(
    walletId: number,
    amount: number,
  ): Promise<Transaction> {
    return await this.db.knex.transaction(async trx => {
      const wallet = await trx<Wallet>('wallet').where({ id: walletId }).first();
      await trx<Wallet>('wallet')
        .where({ id: walletId })
        .update({ balance: wallet.balance + amount });
      const [transactionId] = await trx<Transaction>('transaction').insert({
        amount,
        reason: TransactionReason.DailyCredit,
        recipient_wallet_id: walletId,
      });
      return this.find({ id: transactionId });
    });
  }

  /**
   * Finds a transaction with the given search parameters if one exists.
   * @param transactionSearchParams object containing properties of a transaction for searching on
   * @returns promise resolving in the found transaction object, or rejecting on error
   */
  public async find(transactionSearchParams: Partial<Transaction>): Promise<Transaction> {
    const [transaction] = await this.db.transaction.where(transactionSearchParams);
    return transaction;
  }

  /**
   * Deducts the given amount from the balance for the wallet with the given id, and creates
   * a transaction record.
   * @param walletId id of recipient wallet
   * @param amount amount transacted
   * @returns promise resolving in the created transaction object, or rejecting on error
   */
  public async createHomePurchaseTransaction(
    walletId: number,
    amount: number,
  ): Promise<Transaction> {
    return await this.db.knex.transaction(async trx => {
      const wallet = await trx<Wallet>('wallet').where({ id: walletId }).first();
      await trx<Wallet>('wallet')
        .where({ id: walletId })
        .update({ balance: wallet.balance - amount });
      const [transactionId] = await trx<Transaction>('transaction').insert({
        amount,
        reason: TransactionReason.HomePurchase,
        sender_wallet_id: walletId,
      });
      return this.find({ id: transactionId });
    });
  }

  /**
   * Applies the given amount to the balance for the wallet with the given id, and creates
   * a transaction record.
   * @param walletId id of recipient wallet
   * @param amount amount transacted
   * @returns promise resolving in the created transaction object, or rejecting on error
   */
  public async createHomeRefundTransaction(walletId: number, amount: number): Promise<Transaction> {
    return await this.db.knex.transaction(async trx => {
      const wallet = await trx<Wallet>('wallet').where({ id: walletId }).first();
      await trx<Wallet>('wallet')
        .where({ id: walletId })
        .update({ balance: wallet.balance + amount });
      const [transactionId] = await trx<Transaction>('transaction').insert({
        amount,
        reason: TransactionReason.HomeRefund,
        recipient_wallet_id: walletId,
      });
      return this.find({ id: transactionId });
    });
  }
  public async createWeeklyRoleCreditTransaction(
    walletId: number,
    amount: number,
    roleId: number,
  ): Promise<Transaction> {
    return await this.db.knex.transaction(async trx => {
      const wallet = await trx<Wallet>('wallet').where({ id: walletId }).first();
      await trx<Wallet>('wallet')
        .where({ id: walletId })
        .update({ balance: wallet.balance + amount });
      const [transactionId] = await trx<Transaction>('transaction').insert({
        amount,
        reason: `${TransactionReason.WeeklyCredit} for ${roleId}`,
        recipient_wallet_id: walletId,
      });
      return this.find({ id: transactionId });
    });
  }
  public async createSystemCreditTransaction(
    walletId: number,
    amount: number,
  ): Promise<Transaction> {
    return await this.db.knex.transaction(async trx => {
      const wallet = await trx<Wallet>('wallet').where({ id: walletId }).first();
      await trx<Wallet>('wallet')
        .where({ id: walletId })
        .update({ balance: wallet.balance + amount });
      const [transactionId] = await trx<Transaction>('transaction').insert({
        amount,
        reason: TransactionReason.SystemToMember,
        recipient_wallet_id: walletId,
      });
      return this.find({ id: transactionId });
    });
  }

  public async createObjectUploadTransaction(
    walletId: number,
    amount: number,
  ): Promise<Transaction> {
    return await this.db.knex.transaction(async trx => {
      const wallet = await trx<Wallet>('wallet').where({ id: walletId }).first();
      await trx<Wallet>('wallet')
        .where({ id: walletId })
        .update({ balance: wallet.balance - amount });
      const [transactionId] = await trx<Transaction>('transaction').insert({
        amount,
        reason: TransactionReason.ObjectUpload,
        sender_wallet_id: walletId,
      });
      return this.find({ id: transactionId });
    });
  }

  public async createObjectRestockTransaction(
    walletId: number,
    amount: number,
  ): Promise<Transaction> {
    return await this.db.knex.transaction(async trx => {
      const wallet = await trx<Wallet>('wallet').where({ id: walletId }).first();
      await trx<Wallet>('wallet')
        .where({ id: walletId })
        .update({ balance: wallet.balance - amount });
      const [transactionId] = await trx<Transaction>('transaction').insert({
        amount,
        reason: TransactionReason.ObjectRestock,
        sender_wallet_id: walletId,
      });
      return this.find({ id: transactionId });
    });
  }

  /**
   * Credits a wallet and records the matching ledger row.
   *
   * Split out so a caller that is already inside a transaction can have the
   * credit and the row commit together with its own writes, rather than
   * committing separately and leaving a window where one landed and the other
   * did not.
   */
  private async creditWallet(
    trx: Knex.Transaction,
    walletId: number,
    amount: number,
    reason: TransactionReason,
  ): Promise<Transaction> {
    // `balance = balance + ?` in SQL, not read-then-write in JavaScript. The
    // object-row lock only serialises rejections of the same object; two
    // different objects belonging to one uploader can be rejected at the same
    // moment, and a read-modify-write would let both transactions read the same
    // balance so the second overwrites the first -- losing a refund the ledger
    // still says was paid.
    const credited = await trx<Wallet>('wallet')
      .where({ id: walletId })
      .increment('balance', amount);
    if (!credited) {
      // No such wallet. Raised rather than ignored: the caller is mid-refund and
      // must not commit a ledger row for money that was never credited.
      throw new Error(`Cannot credit unknown wallet ${walletId}`);
    }
    const [transactionId] = await trx<Transaction>('transaction').insert({
      amount,
      reason,
      recipient_wallet_id: walletId,
    });
    // Read back through the same `trx`, not `this.find()` -- that queries
    // through the pool's own connection, which cannot see this row until the
    // transaction commits, and holds the transaction open waiting on a second
    // pool connection. Concurrent refunds could then contend the pool itself.
    const [transaction] = await trx<Transaction>('transaction').where({ id: transactionId });
    return transaction;
  }

  /**
   * Refunds an upload fee.
   *
   * Joins the caller's transaction when one is supplied - the Mall rejection
   * needs the refund and the object's status change to be the same commit - and
   * otherwise opens its own, which is what every existing caller gets.
   */
  public async createObjectUploadRefundTransaction(
    walletId: number,
    amount: number,
    trx?: Knex.Transaction,
  ): Promise<Transaction> {
    if (trx) {
      return this.creditWallet(trx, walletId, amount, TransactionReason.ObjectUploadRefund);
    }
    return await this.db.knex.transaction(async ownTrx =>
      this.creditWallet(ownTrx, walletId, amount, TransactionReason.ObjectUploadRefund));
  }

  public async createUnsoldObjectRefundTransaction(
    walletId: number,
    amount: number,
  ): Promise<Transaction> {
    return await this.db.knex.transaction(async trx => {
      const wallet = await trx<Wallet>('wallet').where({ id: walletId }).first();
      await trx<Wallet>('wallet')
        .where({ id: walletId })
        .update({ balance: wallet.balance + amount });
      const [transactionId] = await trx<Transaction>('transaction').insert({
        amount,
        reason: TransactionReason.ObjectUnsoldInstancesRefund,
        recipient_wallet_id: walletId,
      });
      return this.find({ id: transactionId });
    });
  }

  public async createObjectPurchaseTransaction(
    walletId: number,
    amount: number,
  ): Promise<Transaction> {
    return await this.db.knex.transaction(async trx => {
      const wallet = await trx<Wallet>('wallet').where({ id: walletId }).first();
      await trx<Wallet>('wallet')
        .where({ id: walletId })
        .update({ balance: wallet.balance - amount });
      const [transactionId] = await trx<Transaction>('transaction').insert({
        amount,
        reason: TransactionReason.ObjectPurchase,
        sender_wallet_id: walletId,
      });
      return this.find({ id: transactionId });
    });
  }

  public async createObjectProfitTransaction(
    walletId: number,
    amount: number,
  ): Promise<Transaction> {
    return await this.db.knex.transaction(async trx => {
      const wallet = await trx<Wallet>('wallet').where({ id: walletId }).first();
      await trx<Wallet>('wallet')
        .where({ id: walletId })
        .update({ balance: wallet.balance + amount });
      const [transactionId] = await trx<Transaction>('transaction').insert({
        amount,
        reason: TransactionReason.ObjectProfit,
        recipient_wallet_id: walletId,
      });
      return this.find({ id: transactionId });
    });
  }

  public async createObjectSellTransaction(
    buyerId: number,
    sellerId: number,
    amount: number,
  ): Promise<Transaction> {
    return await this.db.knex.transaction(async trx => {
      const sellerWallet = await trx<Wallet>('wallet').where({ id: sellerId }).first();
      const buyerWallet = await trx<Wallet>('wallet').where({ id: buyerId }).first();
      await trx<Wallet>('wallet')
        .where({ id: sellerId })
        .update({ balance: sellerWallet.balance + amount });
      await trx<Wallet>('wallet')
        .where({ id: buyerId })
        .update({ balance: buyerWallet.balance - amount });
      const [transactionId] = await trx<Transaction>('transaction').insert({
        amount,
        reason: TransactionReason.ObjectSell,
        recipient_wallet_id: sellerId,
        sender_wallet_id: buyerId,
      });
      return this.find({ id: transactionId });
    });
  }

  public async getTransactions(
    type: string,
    limit: number,
    offset: number,
  ): Promise<TransactionRow[]> {
    return this.db.knex
      .select(
        'id',
        'created_at',
        'amount',
        'recipient_wallet_id',
        'sender_wallet_id',
        'reason',
      )
      .from('transaction')
      .where('reason', type)
      .limit(limit)
      .offset(offset)
      .orderBy('id', 'DESC');
  }

  public async getTransactionsByWalletId(
    id: number,
    limit: number,
    offset: number,
  ): Promise<TransactionRow[]> {
    return this.db.knex
      .select(
        'id',
        'created_at',
        'amount',
        'recipient_wallet_id',
        'sender_wallet_id',
        'reason',
      )
      .from('transaction')
      .where('recipient_wallet_id', id)
      .orWhere('sender_wallet_id', id)
      .limit(limit)
      .offset(offset)
      .orderBy('id', 'DESC');
  }

  public async getLatestTransactions(time: Date): Promise<TransactionRow[]> {
    return this.db.knex
      .select('transaction.*')
      .from('transaction')
      .where('created_at', '>=', time)
      .limit(30)
      .orderBy('transaction.id', 'DESC');
  }

  public async getTotal( type: string): Promise<CountRow[]> {
    return this.db.knex
      .count<CountRow[]>('id as count')
      .from('transaction')
      .where('reason', type);
  }

  public async getWalletTotal( id: number): Promise<CountRow[]> {
    return this.db.knex
      .count<CountRow[]>('id as count')
      .from('transaction')
      .where('recipient_wallet_id', id)
      .orWhere('sender_wallet_id', id);
  }

  public async removeAllByWalletId(id: number): Promise<void> {
    await this.db.knex('transaction')
      .where('recipient_wallet_id', id)
      .orWhere('sender_wallet_id', id)
      .del();
  }
}
