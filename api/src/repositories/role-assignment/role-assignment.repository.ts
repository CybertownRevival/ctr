import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { RoleAssignment } from '../../types/models';

/** Repository for fetching/interacting with role assignment data in the database. */
@Service()
export class RoleAssignmentRepository {
  constructor(private db: Db) {}

  public async getByMemberId(memberId: number): Promise<RoleAssignment[]> {
    const results = await this.db.roleAssignment.where('member_id', memberId);
    return results;
  }

  public async getMembersDueRoleCredit(limit: number): Promise<any[]> {
    const results = await this.db.knex
      .max('role.income_cc as income_cc')
      .max('role.income_xp as income_xp')
      .select('role_assignment.member_id', 'member.wallet_id', 'member.xp')
      .from('role_assignment')
      .innerJoin('role', 'role.id', 'role_assignment.role_id')
      .innerJoin('member', 'member.id', 'role_assignment.member_id')
      .where('role.active', 1)
      .where('member.status', 1)
      .whereRaw('DATE(role_assignment.created_at) != DATE(NOW())')
      .whereRaw('DATE(member.last_weekly_role_credit) != DATE(NOW())')
      .groupBy('member_id')
      .limit(limit);
    return results;
  }
}
