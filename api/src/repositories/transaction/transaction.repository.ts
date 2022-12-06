import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import {
  Transaction,
  TransactionReason,
  Wallet,
} from '../../types/models';

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
  public async createDailyCreditTransaction(walletId: number, amount: number):
    Promise<Transaction> {
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
}
