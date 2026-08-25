import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { RoleAssignment } from '../../types/models';
import { wherePayingRole } from '../credit/credit.repository';

/** The donor role ids, and which of them the member should end up holding. */
interface DonorRoleIds {
  supporter: number;
  advocate: number;
  devotee: number;
  champion: number;
  donorLevel?: number;
}

/** A member id, as the access-rights queries select it. */
interface MemberIdRow {
  member_id: number;
}

/** A username, as the access-rights and roster queries select it. */
interface UsernameRow {
  username: string;
}

/** A recent hire: who was given which role. */
interface LatestAssignmentRow extends UsernameRow {
  roleName: string;
}

/** A role a member holds, with the place it is scoped to if any. */
interface MemberRoleRow {
  id: number;
  place_id: number;
  name: string;
  place: string;
}

/** A `count(id)` result, as knex returns it: a single row holding the total. */
export interface AssignmentCount {
  count: number;
}

/** Repository for fetching/interacting with role assignment data in the database. */
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
    deputyCode): Promise<{ owner: MemberIdRow[]; deputies: MemberIdRow[] }> {
    const owner: MemberIdRow[] = await this.db.knex
      .select(
        'member_id',
      )
      .from('role_assignment')
      .where('place_id', placeId)
      .where('role_id', ownerCode);
    const deputies: MemberIdRow[] = await this.db.knex
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
    deputyCode): Promise<{ owner: UsernameRow[]; deputies: UsernameRow[] }> {
    const owner: UsernameRow[] = await this.db.knex
      .select(
        'member.username',
      )
      .from('role_assignment')
      .where('role_assignment.place_id', placeId)
      .where('role_assignment.role_id', ownerCode)
      .innerJoin('member', 'role_assignment.member_id', 'member.id');
    const deputies: UsernameRow[] = await this.db.knex
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

  public async getUsernamesByRoleId(roleId: number): Promise<UsernameRow[]> {
    return this.db.knex('role_assignment')
      .select('member.username')
      .where('role_assignment.role_id', '=', roleId)
      .leftJoin('member', 'role_assignment.member_id', 'member.id');
  }

  public async getLatest(): Promise<LatestAssignmentRow[]> {
    return this.db.knex('role_assignment')
      .select('member.username', 'role.name as roleName')
      .leftJoin('member', 'role_assignment.member_id', 'member.id')
      .join('role', 'role_assignment.role_id', 'role.id')
      .limit(5)
      .orderBy('role_assignment.id', 'desc');
  }
  
  public async getDonor(memberId: number, roleId: DonorRoleIds): Promise<string> {
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
  
  public async getRoleNameAndIdByMemberId(memberId: number): Promise<MemberRoleRow[]> {
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
   * Finds members who are due weekly job pay.
   *
   * Returns ids and nothing else. Everything the payout needs - which role pays, what it
   * pays, the member's XP and wallet - is re-read by CreditRepository inside the
   * transaction that moves the money, because anything read here is already stale by the
   * time a worker gets to it, and a second worker may have paid in between.
   *
   * The join to `role` is what makes the batch worth its size: without the earning-role
   * filter, a member whose only role pays nothing qualifies, takes one of `limit` slots,
   * and displaces someone who actually earned pay.
   * @param limit maximum number of members to return
   * @returns ids of members eligible for weekly pay, at most `limit` of them
   */
  public async getMembersDueRoleCredit(limit: number): Promise<number[]> {
    const rows = await this.db.knex
      .distinct('member.id')
      .from('member')
      .innerJoin('role_assignment', 'member.id', 'role_assignment.member_id')
      .innerJoin('role', 'role_assignment.role_id', 'role.id')
      .where('member.status', 1)
      .where(wherePayingRole)
      .whereRaw('DATE(member.last_weekly_role_credit) != DATE(NOW())')
      .whereRaw('DATE(member.last_daily_login_credit) >= DATE(NOW() - INTERVAL 7 DAY)')
      .limit(limit);
    return rows.map(row => row.id);
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

  public async countByAssigned(id: number): Promise<AssignmentCount[]> {
    // knex types an untyped `count` as a dictionary of unnamed columns; the alias makes
    // the shape known here in a way the builder's own types cannot express.
    const rows = await this.db.knex('role_assignment')
      .count('id as count')
      .where('role_id', id);
    return <AssignmentCount[]><unknown>rows;
  }
}
