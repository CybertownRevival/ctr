import { Service } from 'typedi';

import { ObjectInstanceRepository } from '../../repositories';
import { ObjectInstancePosition, ObjectInstanceRotation } from 'models';
import { Object } from 'models';

/** Service for dealing with blocks */
@Service()
export class ObjectInstanceService {
  constructor(private objectInstanceRepository: ObjectInstanceRepository) {}

  public async find(objectInstanceId: number): Promise<any> {
    return await this.objectInstanceRepository.find(objectInstanceId);
  }

  public async updateObjectPlacement(
    objectInstanceId: number,
    positionObj: ObjectInstancePosition,
    rotationObj: ObjectInstanceRotation,
  ): Promise<void> {
    const position = JSON.stringify({
      x: Number.parseFloat(positionObj.x),
      y: Number.parseFloat(positionObj.y),
      z: Number.parseFloat(positionObj.z),
    });
    const rotation = JSON.stringify({
      x: Number.parseFloat(rotationObj.x),
      y: Number.parseFloat(rotationObj.y),
      z: Number.parseFloat(rotationObj.z),
      angle: Number.parseFloat(rotationObj.angle),
    });

    return await this.objectInstanceRepository.updateObjectPlacement(
      objectInstanceId,
      position,
      rotation,
    );
  }

  public async updateObjectPlaceId(objectInstanceId: number, placeId: number): Promise<void> {
    return await this.objectInstanceRepository.updateObjectPlaceId(objectInstanceId, placeId);
  }

  public async add(object: Partial<Object>, memberId: number): Promise<any> {
    await this.objectInstanceRepository.create(object.id, memberId, 0);
  }

  public async getObjectInstanceWithObject(objectInstanceId: number): Promise<any> {
    return await this.objectInstanceRepository.getObjectInstanceWithObject(objectInstanceId);
  }
}
