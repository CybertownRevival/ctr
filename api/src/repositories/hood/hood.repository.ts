import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { knex } from '../../db';
import { Place } from '../../types/models';

@Service()
export class HoodRepository {
  constructor(private db: Db) {}

  public async find(hoodId: number): Promise<Place> {
    return this.db.place.where({ type: 'hood', id: hoodId }).first();
  }
  
  public async getBlocks(hoodId: number): Promise<any> {
    return knex
      .select('place.id', 'place.name', 'map_location.location')
      .from('place')
      .innerJoin('map_location', 'map_location.place_id', 'place.id')
      .where('map_location.parent_place_id', hoodId)
      .orderBy('map_location.location');
  }
}
