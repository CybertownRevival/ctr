import { Service } from 'typedi';
import {knex} from '../../db';
import { Db } from '../../db/db.class';
import { CountRow } from '../row.types';
import { ObjectInstance } from 'models';

/** One row of a `count(...) ... group by object_id` result. */
interface GroupedCountRow {
  object_id: number;
  total: number | string;
}

/** An owned object instance joined with the fields needed to render it. */
export interface BackpackRow extends ObjectInstance {
  filename: string;
  directory: string;
  name: string;
}

@Service()
export class ObjectInstanceRepository {
  constructor(private db: Db) {}

  public async find(objectInstanceId: number): Promise<ObjectInstance> {
    const [objectInstance] = await this.db.objectInstance.where({
      id: objectInstanceId,
    });
    return objectInstance;
  }

  public async create(
    objectId: number, objectName: string, memberId: number, placeId: number): Promise<number> {
    const [objectInstance] = await this.db.objectInstance.insert({
      object_id: objectId,
      object_name: objectName,
      member_id: memberId,
      place_id: placeId,
    });
    return objectInstance;
  }

  public async findByPlaceId(placeId: number): Promise<ObjectInstance[]> {
    return this.db.objectInstance
      .select('object_instance.*', 'object.filename', 'object.directory', 'object.name')
      .where({ place_id: placeId })
      .join('object', 'object.id', 'object_instance.object_id')
      .orderBy('object_instance.object_name', 'asc');
  }

  public async getAllObjectInstances(limit: number, offset: number): Promise<ObjectInstance[]> {
    return this.db.objectInstance
      .select('object_instance.*',
        'object.name',
        'member.username',
      )
      .join('object', 'object.id', 'object_instance.object_id')
      .join('member', 'member.id', 'object_instance.member_id' )
      .limit(limit)
      .offset(offset)
      .orderBy('id', 'desc');
  }

  public async searchAllObjectInstances(
    id: number, limit: number, offset: number): Promise<ObjectInstance[]> {
    return this.db.objectInstance
      .select('object_instance.*',
        'object.name',
        'object.directory',
        'object.image',
        'member.username',
      )
      .where('object_instance.member_id', id)
      .join('object', 'object.id', 'object_instance.object_id')
      .join('member', 'member.id', 'object_instance.member_id' )
      .limit(limit)
      .offset(offset)
      .orderBy('id', 'desc');
  }

  public async getObjectInstanceWithObject(objectInstanceId: number): Promise<ObjectInstance[]> {
    return this.db.objectInstance
      .select(
        'object_instance.*', 
        'object.filename',
        'object.image',
        'object.directory', 
        'object.name', 
        'member.username')
      .where('object_instance.id', objectInstanceId)
      .join('object', 'object.id', 'object_instance.object_id')
      .join('member', 'member.id', 'object_instance.member_id' );
  }

  public async updateObjectPlaceId(objectInstanceId: number, placeId: number): Promise<void> {
    await this.db.objectInstance.where({ id: objectInstanceId }).update({
      place_id: placeId,
    });
  }

  public async moveAllObjects(id: number): Promise<void> {
    await this.db.objectInstance.where({ member_id: id }).update({
      place_id: 0, member_id: null,
    });
  }

  public async updateObjectOwner(objectId: number, userId: number): Promise<void> {
    await this.db.objectInstance.where({ id: objectId }).update({
      member_id: userId,
    });
  }

  public async seizedObjects(): Promise<ObjectInstance[]> {
    const seizedObjects = await this.db.objectInstance.where({
      member_id: null,
    });
    return seizedObjects;
  }

  public async updateObjectPlacement(
    objectInstanceId: number,
    positionStr: string,
    rotationStr: string,
  ): Promise<void> {
    await this.db.objectInstance.where({ id: objectInstanceId }).update({
      position: positionStr,
      rotation: rotationStr,
    });
  }

  public async updateObjectInstanceOwner(
    objectId: number,
    buyerId: number,
  ): Promise<number> {
    return knex('object_instance')
      .where('id', objectId)
      .update({
        member_id: buyerId, 
        place_id: '0',
        object_price: null,
        object_buyer: null});
  }

  public async updateObjectInstanceName(
    objectId: number,
    objectName: string,
  ): Promise<number> {
    return knex('object_instance')
      .where('id', objectId)
      .update({object_name: objectName});
  }

  public async updateObjectInstancePrice(
    objectId: number,
    objectPrice: string,
  ): Promise<number> {
    return knex('object_instance')
      .where('id', objectId)
      .update({object_price: objectPrice});
  }

  public async updateObjectInstanceBuyer(
    objectId: number,
    objectBuyer: string,
  ): Promise<number> {
    return knex('object_instance')
      .where('id', objectId)
      .update({object_buyer: objectBuyer});
  }

  public async countByObjectId(objectId: number): Promise<number> {
    const count = await this.db.objectInstance
      .count('object_id as total')
      .where('object_id', objectId);
    return parseInt(Object.values(count[0])[0]);
  }

  /**
   * Sold counts for many objects in one query.
   *
   * The single-object `countByObjectId` is fine for one row, but the Out of
   * Stock view asks about every stocked object at once, which meant one query
   * per object. Ids not present in the result have sold nothing and are absent
   * from the map; callers should default those to zero.
   */
  public async countByObjectIds(objectIds: number[]): Promise<{ [objectId: number]: number }> {
    const counts: { [objectId: number]: number } = {};
    if (!objectIds.length) {
      return counts;
    }
    const rows = await this.db.objectInstance
      .select('object_id')
      .count<GroupedCountRow[]>('id as total')
      .whereIn('object_id', objectIds)
      .groupBy('object_id');
    rows.forEach((row: GroupedCountRow) => {
      counts[row.object_id] = Number.parseInt(String(row.total), 10);
    });
    return counts;
  }

  /**
   * Sold counts for every object in one query, for whole-catalogue work such as
   * the export and the Out of Stock view.
   */
  public async countAllByObjectId(): Promise<{ [objectId: number]: number }> {
    const counts: { [objectId: number]: number } = {};
    const rows = await this.db.objectInstance
      .select('object_id')
      .count<GroupedCountRow[]>('id as total')
      .groupBy('object_id');
    rows.forEach((row: GroupedCountRow) => {
      counts[row.object_id] = Number.parseInt(String(row.total), 10);
    });
    return counts;
  }

  public async findForSale(): Promise<CountRow[]> {
    return this.db.objectInstance
      .count<CountRow[]>('id as count')
      .where('object_price', '!=', '')
      .orWhere('object_price', '!=', null);
  }

  public async averageForSale(): Promise<{ price: number }[]> {
    return this.db.objectInstance
      .avg({price: 'object_price'})
      .where('object_price', '!=', '')
      .orWhere('object_price', '!=', null);
  }

  public async highestForSale(): Promise<{ price: number }[]> {
    return this.db.objectInstance
      .max({price: 'object_price'})
      .where('object_price', '!=', '')
      .orWhere('object_price', '!=', null);
  }

  public async totalCount(): Promise<number> {
    const count = await this.db.objectInstance
      .count('object_id as total');
    return parseInt(Object.values(count[0])[0]);
  }

  public async totalSearchCount(id: number): Promise<number> {
    const count = await this.db.objectInstance
      .count('object_id as total')
      .where('member_id', id);
    return parseInt(Object.values(count[0])[0]);
  }

  public async countForSaleById(objectId: number): Promise<number> {
    const count = await this.db.objectInstance
      .count<CountRow[]>('id as count')
      .where('object_id', objectId)
      .andWhere('object_price', '>=', 0)
      .andWhere('object_buyer', null);
    return parseInt(Object.values(count[0])[0]);
  }

  public async countByPublicPlaces(
    objectId: number, fleamarket: number, blackmarket): Promise<number> {
    const count = await this.db.objectInstance
      .count<CountRow[]>('id as count')
      .where('object_id', objectId)
      .andWhere('place_id', fleamarket)
      .orWhere('object_id', objectId)
      .andWhere('place_id', blackmarket);
    return parseInt(Object.values(count[0])[0]);
  }

  public async getMemberBackpack(memberId: number): Promise<BackpackRow[]> {
    return await this.db.objectInstance
      .select('object_instance.*', 'object.filename', 'object.directory', 'object.name')
      .join('object', 'object_instance.object_id', 'object.id')
      .where('object_instance.member_id', memberId)
      .where('place_id', 0)
      .orderBy('object_instance.object_name', 'asc');
  }
}
