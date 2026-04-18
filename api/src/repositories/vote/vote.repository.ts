import { Service } from 'typedi';

import { Db } from '../../db';
import { knex } from '../../db';

@Service()
export class VoteRepository {
  constructor(private db: Db) { }

  public async castMayorVote(
    voteData: {
      status: number;
      member_id: number;
      option_id: number;
      vote_id: number;
      bid: number;
    },
  ): Promise<void> {
    try {
      await knex('vote_response').insert(voteData);
      return;
    } catch (error) {
      console.error('Error casting vote:', error);
      throw error;
    }
  }

  public async checkBid(bid: number): Promise<boolean> {
    try {
      const vote = await knex('vote_response')
        .where('bid', bid)
        .first();
      return vote !== undefined;
    } catch (error) {
      return false;
    }
  }

  public async checkIfVoted(
    memberId: number,
    voteId: number,
  ): Promise<boolean> {
    try {
      const vote = await knex('vote_response')
        .where('member_id', memberId)
        .where('vote_id', voteId)
        .first();
      return vote !== undefined;
    } catch (error) {
      console.error('Error checking if voted:', error);
      return false;
    }
  }

  public async removePlace(id: number): Promise<any> {
    await knex('vote_list')
      .where('place_id', id)
      .del();
  }

  public async removeListByUserId(id: number): Promise<any> {
    await knex('vote_list')
      .where('creator_member_id', id)
      .del();
  }

  public async removeResponseByUserId(id: number): Promise<any> {
    await knex('vote_response')
      .where('member_id', id)
      .del();
  }
}
