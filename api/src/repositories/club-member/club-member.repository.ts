import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { knex } from '../../db';

@Service()
export class ClubMemberRepository {
  constructor(private db: Db) {}
  
  public async addMember(clubId: number, memberId: number, status: string): Promise<void> {
    await knex
      .insert({
        club_id: clubId, 
        member_id: memberId, 
        status: status,
      })
      .into('club_member');
    return;
  }
  
  public async removeMember(clubId: number, memberId: number): Promise<void> {
    await knex('club_member')
      .where({
        club_id: clubId, 
        member_id: memberId,
      })
      .del();
    return;
  }
  
  public async removeAllMembers(clubId: number): Promise<void> {
    await knex('club_member')
      .where({club_id: clubId})
      .del();
    return;
  }
  
  public async getMemberCount(clubId: number): Promise<number> {
    const count = await knex('club_member')
      .count('member_id as member_count')
      .where({club_id: clubId});
    return Number(count[0].member_count);
  }
  
  public async getMembers(clubId: number): Promise<any> {
    return knex('club_member')
      .select('member_id', 'status')
      .where({club_id: clubId});
  }
  
  //check if member is in club
  public async isMember(clubId: number, memberId: number): Promise<boolean> {
    const member = await knex('club_member')
      .where({
        club_id: clubId, 
        member_id: memberId,
        status: 'member',
      });
    return member.length > 0;
  }
}
