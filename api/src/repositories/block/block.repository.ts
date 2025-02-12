import {Service} from 'typedi';

import {Db} from '../../db/db.class';
import {Place} from '../../types/models';

@Service()
export class BlockRepository {
  constructor(private db: Db) {}

  public async find(blockId: number): Promise<Place> {
    return this.db.place.where({ type: 'block', id: blockId }).first();
  }

  public async getMapLocationAndPlacesByBlockId(blockId: number): Promise<any> {
    const locations = await this.db.knex
      .select(
        'map_location.location',
        'map_location.available',
        'place.id',
        'place.name',
        'place.map_icon_index',
        'member.username',
      )
      .from('map_location')
      .leftJoin('place', 'map_location.place_id', 'place.id')
      .leftJoin('member', 'place.member_id', 'member.id')
      .where('map_location.parent_place_id', blockId)
      .orderBy('map_location.location');

    return locations;
  }

  public async totalFreeSpots(): Promise<any> {
    return await this.db.knex
      .count('location as count')
      .from('map_location')
      .where('available', 1);
  }
}
