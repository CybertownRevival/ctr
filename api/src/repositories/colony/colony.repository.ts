import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import {Place} from '../../types/models';

@Service()
export class ColonyRepository {

  constructor(private db: Db) {}

  public async find(colonyId: number): Promise<Place> {
    return this.db.place.where({'type':'colony','id':colonyId}).first();
  }


}
