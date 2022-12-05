import { Service } from 'typedi';

import { Db } from '../../db/db.class';

@Service()
export class WalletRepository {

  constructor(private db: Db) {}
}
