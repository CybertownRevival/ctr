import { Service } from 'typedi';

import { RoleAssignment } from '../../types/models';
import {
  AssignmentCount,
  CreditRepository,
  RoleAssignmentRepository,
} from '../../repositories';

/** Service for interacting with roles */
@Service()
export class RoleAssignmentService {
  constructor(
    private roleAssignmentRepository: RoleAssignmentRepository,
    private creditRepository: CreditRepository,
  ) {}
  
  public async getMembersRoles(memberId: number): Promise<RoleAssignment[]> {
    const response = this.roleAssignmentRepository.getByMemberId(memberId);
    return response;
  }
  
  /**
   * Finds up to `limit` members who are due weekly job pay.
   * @param limit maximum number of members to return
   * @returns ids of members eligible for weekly pay
   */
  public async getMembersDueRoleCredit(limit: number): Promise<number[]> {
    return this.roleAssignmentRepository.getMembersDueRoleCredit(limit);
  }

  /**
   * Pays a member for one week of the highest-paying role they hold.
   *
   * Eligibility is rechecked, and the paying role re-resolved, inside the transaction
   * that moves the money, so a member already paid by another worker is a no-op rather
   * than a second payment.
   * @param memberId id of the member to pay
   * @returns promise resolving when the payout has been decided, rejecting on error
   */
  public async giveWeeklyRoleCredit(memberId: number): Promise<void> {
    await this.creditRepository.giveWeeklyRoleCredit(memberId);
  }

  /**
   * Counts how many members hold the role with the given id.
   * @param id id of the role to count assignments of
   * @returns a single-row count, as knex returns it
   */
  public async countByAssigned(id: number): Promise<AssignmentCount[]> {
    return await this.roleAssignmentRepository.countByAssigned(id);
  }
}
