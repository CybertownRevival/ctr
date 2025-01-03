import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { knex } from '../../db';
import { Place } from '../../types/models';

@Service()
export class ColonyRepository {
  constructor(private db: Db) {}

  public async find(colonyId: number): Promise<Place> {
    return this.db.place.where({ type: 'colony', id: colonyId }).first();
  }
  
  public async getHoods(colonyId: number): Promise<any> {
    return this.db.knex
      .select('place.id', 'place.name', 'map_location.location')
      .from('place')
      .innerJoin('map_location', 'map_location.place_id', 'place.id')
      .innerJoin('place as colony', 'map_location.parent_place_id', 'colony.id')
      .where('colony.id', colonyId)
      .orderBy('map_location.location');
  }
  
}
