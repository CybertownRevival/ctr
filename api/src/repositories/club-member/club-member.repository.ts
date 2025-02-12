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
  
  public async changeMember(clubId: number, memberId: number, status: string): Promise<void> {
    await this.db.knex('club_member')
      .update('status', status)
      .where('club_id', clubId)
      .where('member_id', memberId);
    return;
  }
  
  public async removeAllMembers(clubId: number): Promise<void> {
    await knex('club_member')
      .where({club_id: clubId})
      .del();
    return;
  }
  
  public async getMembers(
    clubId: number, 
    status: string, 
    limit: number, 
    offset: number,
  ): Promise<any> {
    return knex('club_member')
      .select('club_member.member_id', 'club_member.status', 'member.username')
      .where('club_member.club_id', clubId)
      .where('club_member.status', status)
      .innerJoin('member', 'club_member.member_id', 'member.id')
      .orderBy('member.username')
      .limit(limit)
      .offset(offset);
  }
  
  public async getMemberStatus(memberId: number, clubId: number): Promise<string> {
    const status = await knex('club_member')
      .select('status')
      .where({
        club_id: clubId,
        member_id: memberId,
      });
    return status[0].status;
  }
  
  public async getMembersCount(clubId: number, status: string): Promise<number> {
    const count = await knex('club_member')
      .count('member_id as member_count')
      .where({club_id: clubId, status: status});
    return Number(count[0].member_count);
  }
  
  //check if member is in club
  public async isMember(): Promise<any> {
    const member = await knex('club_member')
      .select('club_id', 'member_id',)
      .where('status', 'member');
    return member;
  }

}
