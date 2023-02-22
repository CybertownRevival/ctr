import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import {knex} from '../../db';

@Service()
export class BlockRepository {

  constructor(private db: Db) {}

  public async getMapLocationAndPlacesByBlockId(blockId: number): Promise<any> {
    const locations = await knex
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

}
