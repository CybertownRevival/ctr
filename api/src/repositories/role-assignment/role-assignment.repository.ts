import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { CountRow } from '../row.types';
import { RoleAssignment } from '../../types/models';

/** Repository for fetching/interacting with role assignment data in the database. */
/**
 * The four donor role ids, plus the level being granted.
 *
 * `AdminService.addDonor` resolves these from the role map before calling, so
 * the repository is handed ids rather than names.
 */
export interface DonorRoleIds {
  supporter: number;
  advocate: number;
  devotee: number;
  champion: number;
  donorLevel?: number;
}

/** A username from a place's role assignments. */
interface PlaceUsernameRow {
  username: string;
}

/** A member id from a place's role assignments. */
interface PlaceMemberRow {
  member_id: number;
}

/** A member due their weekly role pay, with the role that pays best. */
export interface RoleCreditRow {
  member_id: number;
  role_id: number;
  wallet_id: number;
  xp: number;
  income_cc: number;
  income_xp: number;
}

/** The one column `getDonor` selects: a role's name, or no row at all. */
export interface RoleNameRow {
  name: string;
}

/** A role assignment flattened for display: the role, and where it applies. */
export interface RoleNameAndId {
  id: number;
  place_id: number | null;
  name: string;
  place: string | null;
}

@Service()
export class RoleAssignmentRepository {
  constructor(private db: Db) {}
  
  public async addDonor(member_id: number, roleId: DonorRoleIds): Promise<void> {
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
  ): Promise<number[]> {
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
    deputyCode): Promise<{ owner: PlaceMemberRow[]; deputies: PlaceMemberRow[] }> {
    const owner: PlaceMemberRow[] = await this.db.knex
      .select(
        'member_id',
      )
      .from('role_assignment')
      .where('place_id', placeId)
      .where('role_id', ownerCode);
    const deputies: PlaceMemberRow[] = await this.db.knex
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
    deputyCode): Promise<{ owner: PlaceUsernameRow[]; deputies: PlaceUsernameRow[] }> {
    const owner: PlaceUsernameRow[] = await this.db.knex
      .select(
        'member.username',
      )
      .from('role_assignment')
      .where('role_assignment.place_id', placeId)
      .where('role_assignment.role_id', ownerCode)
      .innerJoin('member', 'role_assignment.member_id', 'member.id');
    const deputies: PlaceUsernameRow[] = await this.db.knex
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

  public async removeRoleAssignment(id: number): Promise<void> {
    await this.db.knex('role_assignment')
      .where('place_id', id)
      .del();
  }

  public async removeAllByUserId(id: number): Promise<void> {
    await this.db.knex('role_assignment')
      .where('member_id', id)
      .del();
  }

  public async getUsernamesByRoleId(roleId: number): Promise<{ username: string }[]> {
    return this.db.knex('role_assignment')
      .select('member.username')
      .where('role_assignment.role_id', '=', roleId)
      .leftJoin('member', 'role_assignment.member_id', 'member.id');
  }

  public async getLatest(): Promise<{ username: string; roleName: string }[]> {
    return this.db.knex('role_assignment')
      .select('member.username', 'role.name as roleName')
      .leftJoin('member', 'role_assignment.member_id', 'member.id')
      .join('role', 'role_assignment.role_id', 'role.id')
      .limit(5)
      .orderBy('role_assignment.id', 'desc');
  }
  
  public async getDonor(memberId: number, roleId: DonorRoleIds): Promise<RoleNameRow | undefined> {
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
  
  public async getRoleNameAndIdByMemberId(memberId: number): Promise<RoleNameAndId[]> {
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
  public async getMembersDueRoleCredit(limit: number): Promise<RoleCreditRow[]> {
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
  ): Promise<number> {
    return await this.db.knex('role_assignment')
      .where('place_id', placeId)
      .where('member_id', memberId)
      .where('role_id', roleId)
      .del();
  }

  public async countByAssigned(id: number): Promise<CountRow[]> {
    return this.db.knex('role_assignment')
      .count<CountRow[]>('id as count')
      .where('role_id', id);
  }
}
