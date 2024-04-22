import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { Store } from '../../types/models';

/** Repository for fetching/interacting with mall data in the database. */
@Service()
export class MallRepository {
  constructor(private db: Db) {}

  public async findAll(): Promise<Store[]> {
    return this.db.place.where({type: 'shop', status: 1});
  }

}

