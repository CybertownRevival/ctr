import * as _ from 'lodash';
import { Service } from 'typedi';

import{ Db } from '../../db/db.class';
import { Wallet } from '../../types/models';

@Service()
export class WalletService {
  constructor(private db: Db) {}

  public async giveDailyLoginBonus(walletId: number) { }

  public async createTransaction() {}
}
