import { Service } from 'typedi';

import { ColonyRepository, RoleAssignmentRepository, RoleRepository } from '../../repositories';
import { Place } from '../../types/models';

/** Service for dealing with colony */
@Service()
export class ColonyService {
  constructor(
    private colonyRepository: ColonyRepository,
    private roleAssignmentRepository: RoleAssignmentRepository,
    private roleRepository: RoleRepository,
  ) {}

  public async find(colonyId: number): Promise<Place> {
    return await this.colonyRepository.find(colonyId);
  }

  public async getHoods(colonyId: number): Promise<any> {
    return await this.colonyRepository.getHoods(colonyId);
  }

  public async canAdmin(colonyId: number, memberId: number): Promise<boolean> {
    const roleAssignments = await this.roleAssignmentRepository.getByMemberId(memberId);

    if (
      roleAssignments.find(assignment => {
        assignment.role_id === this.roleRepository.roleMap.Admin ||
          assignment.role_id === this.roleRepository.roleMap.CityMayor ||
          assignment.role_id === this.roleRepository.roleMap.DeputyMayor ||
          (assignment.role_id === this.roleRepository.roleMap.ColonyLeader &&
            assignment.place_id === colonyId) ||
          (assignment.role_id === this.roleRepository.roleMap.ColonyDeputy &&
            assignment.place_id === colonyId);
      })
    ) {
      return true;
    }
    return false;
  }
}
