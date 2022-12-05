import * as _ from 'lodash';
import { Service } from 'typedi';

import {
  TransactionRepository,
} from '../../repositories';

/** Service for interacting with wallets */
@Service()
export class WalletService {
  constructor(
    private transactionRepository: TransactionRepository,
  ) {}

  /**
   * Disperses the provided amount of CCs to the provided wallet as a daily login bonus.
   * @param walletId wallet id to disperse daily bonus
   * @param amount amount to be dispersed
   */
  public async giveDailyLoginBonus(walletId: number, amount: number) {
    await this.transactionRepository.createDailyCreditTransaction(walletId, amount);
  }
}
