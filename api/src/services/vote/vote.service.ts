import { Service } from 'typedi';

import { VoteRepository } from '../../repositories';

/** Service for interacting with votes */
@Service()
export class VoteService {
  constructor(
    private voteRepository: VoteRepository,
  ) {}

  public async castMayorVote(
    status: number,
    memberId: number,
    optionPicked: number,
    bid: string,
  ): Promise<void> {
    await this.voteRepository.castMayorVote({
      status: status,
      member_id: memberId,
      option_picked: optionPicked,
      bid: bid,
    });
    return;
  }

}
