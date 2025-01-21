import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { Object } from 'models';

@Service()
export class ObjectRepository {
  constructor(private db: Db) {}

  public async find(objectSearchParams: Partial<Object>): Promise<Object> {
    const [object] = await this.db.object.where(objectSearchParams);
    return object;
  }

  public async findById(objectId: number): Promise<Object> {
    return this.find({ id: objectId });
  }

  /**
   *
   * @param directory
   * @param fileName
   * @param image
   * @param name
   * @param quantity
   * @param price
   * @param memberId
   * @param directory
   * @returns
   */
  public async create(
    directory: string,
    fileName: string,
    image: string,
    texture: string,
    name: string,
    quantity: number,
    price: number,
    memberId: number,
  ): Promise<number> {
    const [object] = await this.db.object.insert({
      directory: directory,
      filename: fileName,
      image: image,
      texture: texture,
      name: name,
      quantity: quantity,
      price: price,
      member_id: memberId,
    });

    return object;
  }

  public async findByStatus(status: number): Promise<any> {
    const objects = await this.db.object.where('status', status);
    return objects;
  }

  public async update(objectId: number, props: object): Promise<any> {
    await this.db.object.where({ id: objectId }).update(props);
  }

  public async updateObjectLimit(objectId: number, limit: number): Promise<any> {
    await this.db.object.where({ id: objectId }).update('limit', limit);
  }

  public async increaseObjectQuantity(
    objectId: number, props: object): Promise<any> {
    await this.db.object.where({ id: objectId }).update(props);
  }

  public async updateObjectName(objectId: number, name: string): Promise<any> {
    await this.db.object.where({ id: objectId }).update('name', name);
  }

  public async getMallForSale(status: number, mallExpiration: string): Promise<any> {
    const objects = await this.db.object
      .where('status', status)
      .where('mall_expiration', '>', mallExpiration);
    return objects;
  }

  public async findAllObjects(
    column: string, 
    compare: string, 
    content: string, 
    limit: number, 
    offset: number,
    orderBy: string,
  ): Promise<any> {
    const objects = await this.db.object
      .select('object.*')
      .where(column, compare, content)
      .limit(limit)
      .offset(offset)
      .orderBy('id', orderBy);
    return objects;
  }

  public async searchMallObjects(search: string, limit: number, offset: number): Promise<any> {
    return await this.db.object
      .where('status','!=', '0')
      .where('status','!=', '2')
      .where(this.like('name', search))
      .limit(limit)
      .offset(offset);
  }

  public async searchAllObjects(
    search: string, 
    compare: string, 
    status:number, 
    limit: number, 
    offset: number): Promise<any> {
    return await this.db.object
      .where('status',compare, status)
      .where(this.like('name', search))
      .limit(limit)
      .offset(offset);
  }

  public async getTotal(search: string): Promise<any> {
    return await this.db.object
      .count('id as count')
      .where('status','!=', '0')
      .where('status','!=', '2')
      .where(this.like('object.name', search));
  }

  public async getSearchTotal(search: string, compare: string, status: number): Promise<any> {
    return await this.db.object
      .count('id as count')
      .where('status',compare, status)
      .where(this.like('object.name', search));
  }

  public async findMallSoldOut(): Promise<any> {
    const objects = await this.db.object
      .select('object.*')
      .where('status', '=', '1');
    return objects;
  }

  public async getUserUploadedObjects(
    userId: number, 
    compare: string, 
    content: string,
    limit: number,
    offset: number): Promise<any> {
    const object = await this.db.object
      .select('object.*', 'member.username')
      .where('object.member_id', userId)
      .where('object.status', compare, content)
      .join('member', 'member.id', 'object.member_id')
      .limit(limit)
      .offset(offset)
      .orderBy('object.name');
    return object;
  }

  public async getMallObject(objectId: number): Promise<any> {
    const object = await this.db.object
      .select('object.*', 'member.username')
      .where('object.id', objectId)
      .where('object.status', 1)
      .join('member', 'member.id', 'object.member_id');
    return object;
  }

  public async total(column: string, compare: string, content: string): Promise<any> {
    return this.db.object.count('id as count').where(column, compare, content);
  }

  public async totalCreator(
    column: string, compare: string, content: string, userId: number): Promise<any> {
    return this.db.object.count('id as count')
      .where('member_id', userId)
      .where(column, compare, content);
  }

  private like(field: string, value: string) {
    return function() {
      this.whereRaw('?? LIKE ?', [field, `%${value}%`]);
    };
  }
}
