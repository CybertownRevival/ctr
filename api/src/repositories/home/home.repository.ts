import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import {Home, Member} from '../../types/models';

/** Repository for fetching/interacting with home data in the database. */
@Service()
export class HomeRepository {

  constructor(private db: Db) {}

  public async create(homeParams: Home): Promise<void> {
    await this.db.home.insert(homeParams);
  }

  public async findById(placeId: number): Promise<Home> {
    const [home] = await this.db.home.where({ place_id: placeId });
    return home;
  }

  /**
   * Updates properties on the home record with the given id.
   * @param placeId id of place to be updated
   * @param props object containing key/value pairs of home properties to be updated
   * @param returning optional. defaults to false. returns the updated record if true.
   * @returns promise resolving in the updated home object, or rejecting on error
   */
  public async update(placeId: number, props: Partial<Home>, returning = false):
    Promise<Home | undefined> {
    await this.db.home
      .where({ place_id: placeId })
      .update(props);
    return returning
      ? this.findById(placeId)
      : undefined;
  }

}
