import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { MallObject } from '../../types/models';

/** Repository for fetching/interacting with mall data in the database. */
@Service()
export class MallRepository {

  constructor(private db: Db) {}

  public async addToMallObjects(objectId: number, placeId: number): Promise<void> {
    await this.db.mall.insert({object_id: objectId, place_id: placeId});
  }

  public async getMallForSale(
    placeId: number): Promise<any> {
    const objects = await this.db.mall
      .select('object.*', 'mall_object.place_id', 'mall_object.position', 'mall_object.rotation')
      .where('place_id', placeId)
      .join('object', 'object.id', 'mall_object.object_id')
      .join('place', 'place.id', 'mall_object.place_id');
    return objects;
  }


  public async updateObjectPlacement(
    mallObjectId: number,
    positionStr: string,
    rotationStr: string,
  ): Promise<void> {
    await this.db.mall.where({ object_id: mallObjectId }).update({
      position: positionStr,
      rotation: rotationStr,
    });
  }
}
