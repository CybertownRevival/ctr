import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { Wallet } from '../../types/models';

/** Repository for fetching/interacting with wallet data in the database. */
@Service()
export class WalletRepository {

  constructor(private db: Db) {}

  /**
   * Finds a wallet record with the given id.
   * @param id id of wallet to look for
   * @returns promise resolving in the found wallet object, or rejecting on error
   */
  public async findById(walletId: number): Promise<Wallet> {
    const [wallet] = await this.db.wallet.where({ id: walletId });
    return wallet;
  }
  
  public async addMoney(walletId: number, newAmount: number): Promise<void> {
  
  }

  public async getMoneyData(): Promise<any> {
    return this.db.wallet.select('balance');
  }
}
