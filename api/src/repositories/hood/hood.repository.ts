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
      .select('place.id', 'place.name', 'place.status', 'map_location.location')
      .from('place')
      .innerJoin('map_location', 'map_location.place_id', 'place.id')
      .where('map_location.parent_place_id', hoodId)
      .where('place.type', 'block')
      .orderBy('map_location.location');
  }

  public async updateBlockStatus(
    hoodId: number,
    blockId: number,
    status: number,
  ): Promise<boolean> {
    const updated = await knex('place')
      .where({
        id: blockId,
        type: 'block',
      })
      .whereExists(function () {
        this.select(knex.raw('1'))
          .from('map_location')
          .whereRaw('map_location.place_id = place.id')
          .where('map_location.parent_place_id', hoodId);
      })
    . update({ status });

    return updated === 1;
  }

  public async renameBlock(
    hoodId: number,
    blockId: number,
    name: string,
  ): Promise<boolean> {
    const updated = await knex('place')
      .where({
        id: blockId,
        type: 'block',
      })
      .whereExists(function () {
        this.select(knex.raw('1'))
          .from('map_location')
          .whereRaw('map_location.place_id = place.id')
          .where('map_location.parent_place_id', hoodId);
      })
      .update({ name });

    return updated === 1;
  }

}
