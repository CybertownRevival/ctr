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
            assignment.place_id === colonyId)
        );
      })
    ) {
      return true;
    }
    return false;
  }
}
