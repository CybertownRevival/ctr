import { Service } from 'typedi';

import {
  RoleAssignmentRepository,
  RoleRepository,
  ObjectInstanceRepository,
  ObjectRepository,
  PlaceRepository,
  MallRepository,
  MemberRepository
} from '../../repositories';
import { MallObjectPosition, MallObjectRotation } from 'models';

/** Service for dealing with the mall */
@Service()
export class MallService {
  constructor(
    private roleAssignmentRepository: RoleAssignmentRepository,
    private roleRepository: RoleRepository,
    private objectRepository: ObjectRepository,
    private objectInstanceRepository: ObjectInstanceRepository,
    private placeRepository: PlaceRepository,
    private mallRepository: MallRepository,
    private memberRepository: MemberRepository,
  ) {}

  public async canAdmin(memberId: number): Promise<boolean> {
    const roleAssignments = await this.roleAssignmentRepository.getByMemberId(memberId);
    if (
      roleAssignments.find(assignment => {
        return [
          this.roleRepository.roleMap.Admin,
          this.roleRepository.roleMap.MallDeputy,
          this.roleRepository.roleMap.MallManager,
        ].includes(assignment.role_id);
      })
    ) {
      return true;
    }
    return false;
  }

  public async isObjectAvailable(objectId: number): Promise<boolean> {
    const object = await this.objectRepository.find({ id: objectId });
    if (!object) {
      return false;
    }
    const instances = await this.objectInstanceRepository.countByObjectId(objectId);

    if (object.status !== 1) {
      return false;
    }

    if (instances >= object.quantity) {
      return false;
    }
    return true;
  }

  public async getMallStores(){
    const stores = await this.placeRepository.findAllStores();
    return stores;
  }

  public async getAllObjects(
    column: string, compare: string, content: string, limit: number, offset: number){
    const returnObjects= [];
    const objects = await this.objectRepository
      .findAllObjects(column, compare, content, limit, offset);
    objects.forEach(obj => {
      const user = this.memberRepository.findById(obj.member_id);
      const store = this.mallRepository.getStore(obj.id);
      if(store){
        store.then((value) => {
          obj.store = value[0];
        });
      }
      user.then((value) => {
        obj.username = value.username;
      });
      const instances = this.objectInstanceRepository.countByObjectId(obj.id);
      instances.then((value) => {
        obj.instances = value;
      });
      returnObjects.push(obj);
    });
    
    const total = await this.objectRepository.total(column, compare, content);
    return {
      objects: returnObjects,
      total: total,
    };
  }

  public async getStore(id: number){
    const stores = await this.mallRepository.getStore(id);
    return stores;
  }

  public async updateObjectPlacement(
    mallObjectId: number,
    positionObj: MallObjectPosition,
    rotationObj: MallObjectRotation,
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

    return await this.mallRepository.updateObjectPlacement(
      mallObjectId,
      position,
      rotation,
    );
  }
}
