import { Service } from 'typedi';

import {
  RoleAssignmentRepository,
  RoleRepository,
} from '../../repositories';

/** Service for dealing with the flea market */
@Service()
export class FleaMarketService {
  constructor(
    private roleAssignmentRepository: RoleAssignmentRepository,
    private roleRepository: RoleRepository,
  ) {}

  public async canAdmin(memberId: number): Promise<boolean> {
    const roleAssignments = await this.roleAssignmentRepository.getByMemberId(memberId);
    if (
      roleAssignments.find(assignment => {
        return [
          this.roleRepository.roleMap.Admin,
          this.roleRepository.roleMap.FleaMarketDeputy,
          this.roleRepository.roleMap.FleaMarketChief,
        ].includes(assignment.role_id);
      })
    ) {
      return true;
    }
    return false;
  }
}
