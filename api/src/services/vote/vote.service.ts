import { Service } from 'typedi';

import { VoteRepository } from '../../repositories';

/** Service for interacting with votes */
@Service()
export class VoteService {
  constructor(
    private voteRepository: VoteRepository,
  ) { }

  public async castMayorVote(
    status: number,
    memberId: number,
    optionPicked: number,
    voteId: number,
    bid: string,
  ): Promise<void> {
    try {
      await this.voteRepository.castMayorVote({
        status: status,
        member_id: memberId,
        option_id: optionPicked,
        vote_id: voteId,
        bid: bid,
      });
      return;
    } catch (error) {
      console.error('Service Error casting vote:', error);
      throw error;
    }
  }

  public async checkIfVoted(
    memberId: number,
    voteId: number,
  ): Promise<boolean> {
    return await this.voteRepository.checkIfVoted(memberId, voteId);
  }

}
