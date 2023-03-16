import { Service } from 'typedi';

import { Db } from '../../db/db.class';

@Service()
export class ObjectInstanceRepository {

  constructor(private db: Db) {}

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
