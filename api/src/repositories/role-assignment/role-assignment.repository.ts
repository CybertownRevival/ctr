import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { knex } from 'knex';
import { RoleAssignment } from '../../types/models';

/** Repository for fetching/interacting with role assignment data in the database. */
@Service()
export class RoleAssignmentRepository {
  constructor(private db: Db) {}

  public async getByMemberId(memberId: number): Promise<RoleAssignment[]> {
    const roleResults = await this.db.roleAssignment.where('member_id', memberId);
    return roleResults;
  }
  
  public async getRoleNameAndIdByMemberId(memberId: number): Promise<any> {
    return this.db.knex
      .distinct(
        'role_assignment.role_id as id',
        'role.name as name',
      )
      .from('role_assignment')
      .leftJoin('role', 'role_assignment.role_id', 'role.id')
      .where('role_assignment.member_id', memberId);
  }

  public async getMembersDueRoleCredit(limit: number, offset: number): Promise<any[]> {
    const results = await this.db.knex
      .select(
        'role_assignment.member_id',
        'role_assignment.role_id',
        'member.wallet_id',
        'member.xp',
        'role.income_cc as income_cc',
        'role.income_xp as income_xp',
      )
      .from('role_assignment')
      .innerJoin('role', 'role.id', 'role_assignment.role_id')
      .innerJoin('member', 'member.id', 'role_assignment.member_id')
      .where('role.active', 1)
      .where('member.status', 1)
      .whereRaw('DATE(role_assignment.created_at) != DATE(NOW())')
      .whereRaw('DATE(member.last_weekly_role_credit) != DATE(NOW())')
      .whereRaw('DATE(member.last_daily_login_credit) >= DATE(NOW() - INTERVAL 7 DAY)')
      .groupBy('role_assignment.member_id')
      .groupBy('role_assignment.role_id')
      .limit(limit)
      .offset(offset);
    return results;
  }
}
