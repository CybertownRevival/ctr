import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { knex } from '../../db';

@Service()
export class ClubMemberRepository {
  constructor(private db: Db) {}
  
  public async addMember(clubId: number, memberId: number, status: string): Promise<void> {
    await knex.insert({club_id: clubId, member_id: memberId, status: status}).into('club_member');
    return;
  }
}
