import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { ObjectInstance, Object } from 'models';

@Service()
export class ObjectInstanceRepository {
  constructor(private db: Db) {}

  public async find(objectInstanceId: number): Promise<ObjectInstance> {
    const [objectInstance] = await this.db.objectInstance.where({
      id: objectInstanceId,
    });
    return objectInstance;
  }

  public async create(objectId: number, memberId: number, placeId: number): Promise<number> {
    const [objectInstance] = await this.db.objectInstance.insert({
      object_id: objectId,
      member_id: memberId,
      place_id: placeId,
    });
    return objectInstance;
  }

  public async findByPlaceId(placeId: number): Promise<ObjectInstance[]> {
    return this.db.objectInstance
      .select('object_instance.*', 'object.filename', 'object.directory', 'object.name')
      .where({ place_id: placeId })
      .join('object', 'object.id', 'object_instance.object_id');
  }

  public async getObjectInstanceWithObject(objectInstanceId: number): Promise<ObjectInstance[]> {
    return this.db.objectInstance
      .select('object_instance.*', 'object.filename', 'object.directory', 'object.name')
      .where('object_instance.id', objectInstanceId)
      .join('object', 'object.id', 'object_instance.object_id');
  }

  public async updateObjectPlaceId(objectInstanceId: number, placeId: number): Promise<void> {
    await this.db.objectInstance.where({ id: objectInstanceId }).update({
      place_id: placeId,
    });
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

  public async countByObjectId(objectId: number): Promise<number> {
    const count = await this.db.objectInstance
      .count('object_id as total')
      .where('object_id', objectId);
    return parseInt(Object.values(count[0])[0]);
  }

  public async getMemberBackpack(memberId: number): Promise<any> {
    return await this.db.objectInstance
      .select('object_instance.*', 'object.filename', 'object.directory', 'object.name')
      .join('object', 'object_instance.object_id', 'object.id')
      .where('object_instance.member_id', memberId)
      .where('place_id', 0);
  }
}
