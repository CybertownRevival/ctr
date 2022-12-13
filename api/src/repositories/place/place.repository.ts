import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { Place } from '../../types/models';

/** Repository for fetching/interacting with place data in the database. */
@Service()
export class PlaceRepository {

  constructor(private db: Db) {}

  /**
   * Finds a place record with the given id.
   * @param id id of place to look for
   * @returns promise resolving in the found place object, or rejecting on error
   */
  public async findById(placeId: number): Promise<Place> {
    const [place] = await this.db.place.where({ id: placeId });
    return place;
  }

  /**
   * Finds a place record which is a home for a given member id
   * @param memberId
   */
  public async findHomeByMemberId(memberId: number): Promise<Place> {
    const [place] = await this.db.place.where({ type: 'home', member_id: memberId });
    return place;
  }

}
