import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { Transaction } from 'models';

@Service()
export class TransactionRepository {

  constructor(private db: Db) {}
}
