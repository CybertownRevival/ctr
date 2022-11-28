import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { Wallet } from 'models';

@Service()
export class WalletRepository {

  constructor(private db: Db) {}
}
