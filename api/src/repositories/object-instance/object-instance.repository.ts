import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import {ObjectInstance} from 'models';

@Service()
export class ObjectInstanceRepository {

  constructor(private db: Db) {}

  public async findByPlaceId(placeId: number): Promise<ObjectInstance[]> {
    return this.db.objectInstance.where({ place_id: placeId });
  }

  public async updateObjectPlacement(
    objectInstanceId: number,
    positionStr: string,
    rotationStr: string,
  ): Promise<void> {

    await this.db.objectInstance
      .where({ id: objectInstanceId })
      .update({
        position: positionStr,
        rotation: rotationStr,
      });
  }

}
