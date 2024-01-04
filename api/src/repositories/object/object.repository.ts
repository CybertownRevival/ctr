import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { Object } from 'models';

@Service()
export class ObjectRepository {
  constructor(private db: Db) {}

  /**
   *
   * @param directory
   * @param fileName
   * @param image
   * @param name
   * @param quantity
   * @param price
   * @param memberId
   * @returns
   */
  public async create(
    directory: string,
    fileName: string,
    image: string,
    name: string,
    quantity: number,
    price: number,
    memberId: number,
  ): Promise<number> {
    const [object] = await this.db.object.insert({
      directory: directory,
      filename: fileName,
      image: image,
      name: name,
      quantity: quantity,
      price: price,
      member_id: memberId,
    });

    return object;
  }
}
