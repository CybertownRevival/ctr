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
      bid: string;
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
}
