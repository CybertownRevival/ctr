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

  public async findStorageByUserID(memberId: number): Promise<any> {
    return await this.db.place
      .select('place.name', 'place.id')
      .where({type: 'storage', member_id: memberId})
      .orderBy('place.name', 'asc');
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

  public async updatePlaces(id: number, column: string, content: string): Promise<any> {
    await this.db.place
      .where({id: id})
      .update(column, content);
  }

  /**
 * This is to assist with the pagination of the place search
 * @param type
 * @return string
 */
  public async totalByType(type: string): Promise<any> {
    return this.db.place.count('id as count').where('type', type);
  }

  /**
   * returns results of places by type (pagination)
   * @param type
   * @param limit
   * @param offset
   * @returns
   */
  public async findByType(type: string, limit: number, offset: number): Promise<any> {
    return this.db.place
      .select(['place.*'])
      .where('place.type', type)
      .orderBy('place.id')
      .limit(limit)
      .offset(offset);
  }

  public async searchAllPlaces(
    search: string, 
    compare: string, 
    type: string, 
    limit: number, 
    offset: number): Promise<any> {
    return await this.db.place
      .where('type',compare, type)
      .where(this.like('name', search))
      .limit(limit)
      .offset(offset);
  }

  public async getSearchTotal(search: string, compare: string, type: string): Promise<any> {
    return await this.db.place
      .count('id as count')
      .where('type',compare, type)
      .where(this.like('place.name', search));
  }

  private like(field: string, value: string) {
    return function() {
      this.whereRaw('?? LIKE ?', [field, `%${value}%`]);
    };
  }

}
