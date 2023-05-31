import { Service } from 'typedi';

import {
  MapLocationRepository,
  HoodRepository,
  ColonyRepository,
  RoleAssignmentRepository,
  RoleRepository,
} from '../../repositories';
import { Place } from '../../types/models';

/** Service for dealing with blocks */
@Service()
export class HoodService {
  constructor(
    private mapLocationRepository: MapLocationRepository,
    private hoodRepository: HoodRepository,
    private colonyRepository: ColonyRepository,
    private roleAssignmentRepository: RoleAssignmentRepository,
    private roleRepository: RoleRepository,
  ) {}

  public async find(hoodId: number): Promise<Place> {
    return await this.hoodRepository.find(hoodId);
  }

  public async getColony(hoodId: number): Promise<Place> {
    const hoodMapLocation = await this.mapLocationRepository.findPlaceIdMapLocation(hoodId);
    return await this.colonyRepository.find(hoodMapLocation.parent_place_id);
  }

  public async getBlocks(hoodId: number): Promise<any> {
    return await this.hoodRepository.getBlocks(hoodId);
  }

  public async canAdmin(hoodId: number, memberId: number): Promise<boolean> {
    const roleAssignments = await this.roleAssignmentRepository.getByMemberId(memberId);
    const colony = await this.getColony(hoodId);

    if (
      roleAssignments.find(assignment => {
        return (
          [
            this.roleRepository.roleMap.Admin,
            this.roleRepository.roleMap.CityMayor,
            this.roleRepository.roleMap.DeputyMayor,
          ].includes(assignment.role_id) ||
          ([
            this.roleRepository.roleMap.ColonyLeader,
            this.roleRepository.roleMap.ColonyDeputy,
          ].includes(assignment.role_id) &&
            assignment.place_id === colony.id) ||
          ([
            this.roleRepository.roleMap.NeighborhoodDeputy,
            this.roleRepository.roleMap.NeighborhoodLeader,
          ].includes(assignment.role_id) &&
            assignment.place_id === hoodId)
        );
      })
    ) {
      return true;
    }
    return false;
  }
}
