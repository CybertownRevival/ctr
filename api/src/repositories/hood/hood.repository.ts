import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import {Place} from '../../types/models';

@Service()
export class HoodRepository {

  constructor(private db: Db) {}

  public async find(hoodId: number): Promise<Place> {
    return this.db.place.where({'type':'hood','id':hoodId}).first();
  }


}
