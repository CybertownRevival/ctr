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

  public async getMallForSale(status: number, mallExpiration: string): Promise<any> {
    const objects = await this.db.object
      .where('status', status)
      .where('mall_expiration', '>', mallExpiration);
    return objects;
  }
}
