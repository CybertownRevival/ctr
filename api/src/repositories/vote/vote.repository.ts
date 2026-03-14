import { Service } from 'typedi';

import { Db } from '../../db';
import {knex} from '../../db';

@Service()
export class VoteRepository {
  constructor(private db: Db) {}

  public async castMayorVote(
    voteData: {
      status: number;
      member_id: number;
      option_picked: number;
      bid: string;
    },
  ): Promise<void> {
    await knex('vote_response').insert(voteData);
    return;
  }
}
