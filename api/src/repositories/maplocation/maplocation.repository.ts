import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { MapLocation } from '../../types/models';

/** Repository for fetching/interacting with place data in the database. */
@Service()
export class MapLocationRepository {

  constructor(private db: Db) {}

  public async findParentPlaceId(placeId: number): Promise<number> {
    const [mapLocation] = await this.db.mapLocation.where({ place_id: placeId });
    return mapLocation.parent_place_id;

  }

}
