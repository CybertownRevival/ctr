import { Service } from 'typedi';

import {
  RoleAssignmentRepository,
  RoleRepository,
  ObjectInstanceRepository,
  ObjectRepository,
  PlaceRepository,
} from '../../repositories';

/** Service for dealing with blocks */
@Service()
export class MallService {
  constructor(
    private roleAssignmentRepository: RoleAssignmentRepository,
    private roleRepository: RoleRepository,
    private objectRespository: ObjectRepository,
    private objectInstanceRepository: ObjectInstanceRepository,
    private placeRepository: PlaceRepository,
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
    const object = await this.objectRespository.find({ id: objectId });
    if (!object) {
      return false;
    }
    const instances = await this.objectInstanceRepository.countByObjectId(objectId);

    console.log(object);

    if (object.status !== 1) {
      return false;
    }

    if (new Date() > object.mall_expiration) {
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
}
