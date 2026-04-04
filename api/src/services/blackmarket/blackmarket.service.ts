import { Service } from 'typedi';

import {
  RoleAssignmentRepository,
  RoleRepository,
} from '../../repositories';

/** Service for dealing with the flea market */
@Service()
export class BlackMarketService {
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
          this.roleRepository.roleMap.BlackMarketDeputy,
          this.roleRepository.roleMap.BlackMarketChief,
        ].includes(assignment.role_id);
      })
    ) {
      return true;
    }
    return false;
  }
}
