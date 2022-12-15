import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import {MapLocation, Place} from '../../types/models';

/** Repository for fetching/interacting with place data in the database. */
@Service()
export class MapLocationRepository {

  constructor(private db: Db) {}

  public async findPlaceIdMapLocation(placeId: number): Promise<MapLocation> {
    const [mapLocation] = await this.db.mapLocation.where({ place_id: placeId });
    return mapLocation;
  }

  public async findByParentPlaceIdAndLocation(parentPlaceId: number, location: number): Promise<MapLocation> {
    const [mapLocation] = await this.db.mapLocation.where({
      parent_place_id: parentPlaceId,
      location: location,
    });
    return mapLocation;
  }

  /**
   * Creates a new map location with the given parameters.
   * @param locationParams parameters to be used for the new map location
   * @returns promise
   */
  public async create(locationParams: Partial<MapLocation>): Promise<void> {
    // todo on duplicate key update
    await this.db.mapLocation.insert(locationParams)
      .onConflict(['parent_place_id','location'])
      .merge(['place_id','available']);
  }

}
