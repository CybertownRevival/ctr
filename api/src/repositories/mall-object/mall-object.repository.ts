import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { MallObject } from '../../types/models';

/** Repository for fetching/interacting with mall data in the database. */
@Service()
export class MallRepository {

  constructor(private db: Db) {}

  public async addToMallObjects(objectId: number): Promise<void> {
    await this.db.mallObject.insert({object_id: objectId});
  }

  public async getMallForSale(
    placeId: number): Promise<any> {
    const objects = await this.db.mallObject
      .select('object.*', 'mall_object.place_id', 'mall_object.position', 'mall_object.rotation')
      .where('place_id', placeId)
      .where('object.status', 1)
      .join('object', 'object.id', 'mall_object.object_id')
      .join('place', 'place.id', 'mall_object.place_id');
    return objects;
  }

  public async getStore(objectId: number): Promise<any> {
    const place = await this.db.mallObject
      .select('place.*')
      .where('mall_object.object_id',  objectId)
      .join('place', 'place.id', 'mall_object.place_id');
    return place;
  }

  public async findByObjectId(objectId: number): Promise<any> {
    const object = await this.db.mallObject.where({object_id: objectId});
    return object;
  }

  public async updateObjectPlace(
    mallObjectId: number,
    shopId: number,
  ): Promise<void> {
    await this.db.mallObject.where({ object_id: mallObjectId }).update({
      place_id: shopId,
      position: '{"x":0.0,"y":1.75,"z":0.0}',
      rotation: '{"x":0,"y":0,"z":0,"angle":0}',
    });
  }

  public async updateObjectPlacement(
    mallObjectId: number,
    positionStr: string,
    rotationStr: string,
  ): Promise<void> {
    await this.db.mallObject.where({ object_id: mallObjectId }).update({
      position: positionStr,
      rotation: rotationStr,
    });
  }
}
