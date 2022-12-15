import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { Home } from '../../types/models';

/** Repository for fetching/interacting with place data in the database. */
@Service()
export class HomeRepository {

  constructor(private db: Db) {}

  public async create(homeParams: Home): Promise<void> {
    await this.db.home.insert(homeParams);
  }

}
