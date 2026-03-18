import { Service } from 'typedi';

import { VoteRepository } from '../../repositories';

/** Service for interacting with votes */
@Service()
export class VoteService {
  constructor(
    private voteRepository: VoteRepository,
  ) { }

  public async getBid(): Promise<number> {
    //random 16 digit number
    const bid = Math.floor(1000000000000000 + Math.random() * 9000000000000000);
    if (await this.voteRepository.checkBid(bid)) {
      return this.getBid();
    }
    return bid;
  }

  public async castMayorVote(
    status: number,
    memberId: number,
    optionPicked: number,
    voteId: number,
    bid: number,
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
