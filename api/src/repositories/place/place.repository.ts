import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import {Home, Place, Store} from '../../types/models';

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

  public async findBySlug(slug: string): Promise<Place> {
    return this.db.place.where({ slug: slug }).first();
  }

  public async findAllStores(): Promise<Store[]> {
    return this.db.place.where({type: 'shop', status: 1});
  }

  /**
   * Finds a place record which is a home for a given member id
   * @param memberId
   */
  public async findHomeByMemberId(memberId: number): Promise<Place> {
    const [place] = await this.db.place.where({ type: 'home', member_id: memberId });
    return place;
  }

  /**
   * Creates a new place with the given parameters.
   * @param placeParams parameters to be used for the new place
   * @returns promise resolving in the id for the newly created place
   */
  public async create(placeParams: Partial<Place>): Promise<number> {
    const [placeId] = await this.db.place.insert(placeParams);
    return placeId;
  }

  public async updateHomeByMemberId(memberId: number, props: Partial<Place>, returning = false):
    Promise<Place | undefined> {
    await this.db.place
      .where({ type: 'home', member_id: memberId })
      .update(props);
    return returning
      ? this.findHomeByMemberId(memberId)
      : undefined;
  }

}
