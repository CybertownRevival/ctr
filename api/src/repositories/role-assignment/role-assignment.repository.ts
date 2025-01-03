import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { knex } from 'knex';
import { RoleAssignment } from '../../types/models';

/** Repository for fetching/interacting with role assignment data in the database. */
@Service()
export class RoleAssignmentRepository {
  constructor(private db: Db) {}
  
  public async addDonor(member_id: number, roleId: any): Promise<void> {
    try{
      await this.db.knex('role_assignment')
        .where('member_id', member_id)
        .whereIn('role_id', [
          roleId.supporter,
          roleId.advocate,
          roleId.devotee,
          roleId.champion,
        ])
        .del();
    } finally {
      if (roleId.donorLevel !== undefined) {
        await this.db.knex('role_assignment').insert({
          member_id: member_id,
          role_id: roleId.donorLevel,
        });
      }
    }
  }

  public async addIdToAssignment(
    placeId: number,
    memberId: number,
    roleId: number,
  ): Promise<any> {
    return this.db.knex('role_assignment')
      .insert(
        {
          role_id: roleId,
          member_id: memberId,
          place_id: placeId,
        },
      );
  }

  public async getAccessInfoByID(
    placeId,
    ownerCode,
    deputyCode): Promise<{ owner: any[]; deputies: any[] }> {
    const owner: any[] = await this.db.knex
      .select(
        'member_id',
      )
      .from('role_assignment')
      .where('place_id', placeId)
      .where('role_id', ownerCode);
    const deputies: any[] = await this.db.knex
      .select(
        'member_id',
      )
      .from('role_assignment')
      .where('place_id', placeId)
      .where('role_id', deputyCode);
    return {deputies, owner};
  }

  public async getAccessInfoByUsername(
    placeId,
    ownerCode,
    deputyCode): Promise<{ owner: any[]; deputies: any[] }> {
    const owner: any[] = await this.db.knex
      .select(
        'member.username',
      )
      .from('role_assignment')
      .where('role_assignment.place_id', placeId)
      .where('role_assignment.role_id', ownerCode)
      .innerJoin('member', 'role_assignment.member_id', 'member.id');
    const deputies: any[] = await this.db.knex
      .select(
        'member.username',
      )
      .from('role_assignment')
      .where('role_assignment.place_id', placeId)
      .where('role_assignment.role_id', deputyCode)
      .innerJoin('member', 'role_assignment.member_id', 'member.id');
    return {deputies, owner};
  }
  
  public async getByMemberId(memberId: number): Promise<RoleAssignment[]> {
    const roleResults = await this.db.roleAssignment.where('member_id', memberId);
    return roleResults;
  }

  public async getUsernamesByRoleId(roleId: number): Promise<any> {
    return this.db.knex('role_assignment')
      .select('member.username')
      .where('role_assignment.role_id', '=', roleId)
      .leftJoin('member', 'role_assignment.member_id', 'member.id');
  }
  
  public async getDonor(memberId: number, roleId: any): Promise<string> {
    return this.db.knex
      .select('role.name')
      .from('role_assignment')
      .innerJoin('role', 'role_assignment.role_id', 'role.id')
      .where('role_assignment.member_id', memberId)
      .whereIn('role_id', [
        roleId.supporter,
        roleId.advocate,
        roleId.devotee,
        roleId.champion,
      ])
      .limit(1)
      .first();
  }
  
  public async getRoleNameAndIdByMemberId(memberId: number): Promise<any> {
    return this.db.knex
      .distinct(
        'role_assignment.role_id as id',
        'role_assignment.place_id as place_id',
        'role.name as name',
        'place.name as place',
      )
      .from('role_assignment')
      .leftJoin('role', 'role_assignment.role_id', 'role.id')
      .leftJoin('place', 'role_assignment.place_id', 'place.id')
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

  public async removeIdFromAssignment(
    placeId: number,
    memberId: number,
    roleId: number,
  ): Promise<any> {
    return this.db.knex('role_assignment')
      .where('place_id', placeId)
      .where('member_id', memberId)
      .where('role_id', roleId)
      .del();
  }
}
