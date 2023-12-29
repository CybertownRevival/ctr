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
  
  /**
   * query finds all users with job who meet pay requirements
   * the inner join is just there to check for holding a job
   * then the for function will gather the highest paying role information per user
   * the for function also packages all the information for the return
   * @param limit
   * @returns list of users with jobs that earned pay
   */
  public async getMembersDueRoleCredit(limit: number): Promise<any> {
    const query = await this.db.knex
      .select(
        'member.id',
        'member.wallet_id',
        'member.xp',
      )
      .from('member')
      .innerJoin('role_assignment', 'member.id', 'role_assignment.member_id')
      .where('member.status', 1)
      .whereRaw('DATE(member.last_weekly_role_credit) != DATE(NOW())')
      .whereRaw('DATE(member.last_daily_login_credit) >= DATE(NOW() - INTERVAL 7 DAY)')
      .limit(limit)
      .distinct('member.id');
    
    const results = [];
    for (const index in query) {
      const member_info = query[index];
      const role_info = await this.db.knex
        .select(
          'role_assignment.role_id',
          'role.income_cc',
          'role.income_xp',
        )
        .from('role_assignment')
        .innerJoin('role', 'role_assignment.role_id', 'role.id')
        .where('role_assignment.member_id', member_info.id)
        .orderBy('role.income_cc','desc')
        .first();
      if (role_info) {
        results[index] = {
          member_id: member_info.id,
          role_id: role_info.role_id,
          wallet_id: member_info.wallet_id,
          xp: member_info.xp,
          income_cc: role_info.income_cc,
          income_xp: role_info.income_xp,
        };
      }
    }
    return results;
  }
}
