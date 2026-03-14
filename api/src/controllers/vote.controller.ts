import { Request, Response } from 'express';
import { Container } from 'typedi';
import { 
  VoteService,
  HomeService,
  MemberService,
} from '../services';

class VoteController {

  constructor(
    private voteService: VoteService,
    private homeService: HomeService,
    private memberService: MemberService,
  ) {}
  
  // Required experience points to be eligible to vote
  public static readonly REQUIRED_EXPERIENCE = 1000;
  // Voting starts on March 13, 2026 at 12:00 AM EDT
  public static readonly VOTING_START_DATE = new Date('2026-03-13T00:00:00-04:00');
  // Voting ends on March 20, 2026 at 11:59 PM EDT
  public static readonly VOTING_END_DATE = new Date('2026-03-20T23:59:59-04:00');

  // method for handling casting a vote
  async castMayorVote(req: Request, res: Response) {
    const { apitoken, bid } = req.headers;
    const { optionPicked } = req.body;

    // Validate input
    if (!optionPicked) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if voting is currently open
    const now = new Date(
      new Date()
        .toLocaleString('en-US', { timeZone: 'America/New_York' }),
    );
    console.log('Voting Start Date (EDT):', VoteController.VOTING_START_DATE);
    console.log('Voting End Date (EDT):', VoteController.VOTING_END_DATE);
    console.log('Current EDT time:', now);
    if (now <= VoteController.VOTING_START_DATE || now >= VoteController.VOTING_END_DATE) {
      return res.status(403).json({ error: 'Voting is not currently open' });
    }

    // Get user ID from request
    const session = this.memberService.decodeMemberToken(<string>apitoken);
    if (!session || !session.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has enough experience points to vote
    const member = await this.memberService.find({ id: session.id });
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    if (member.xp < VoteController.REQUIRED_EXPERIENCE) {
      return res.status(403).json({ error: 'Not enough experience points to vote' });
    }

    // Check if user owns a home
    if (!this.homeService.getHome(session.id)) {
      return res.status(403).json({ error: 'Owning a home is required to vote' });
    }

    // Cast the vote using the service
    let result;
    if (!bid || typeof bid !== 'string') {
      const bid = await this.memberService.getBid(session.id);
      try {
        result = await this.voteService.castMayorVote(1, session.id, optionPicked, bid);
      } catch (error) {
        console.error('Error casting vote with bid:', error);
        return res.status(500).json({ error: 'Failed to cast vote' });
      }
    } else {
      try {
        result = await this.voteService.castMayorVote(0, session.id, optionPicked, bid);
      } catch (error) {
        console.error('Error casting vote with bid:', error);
        return res.status(500).json({ error: 'Failed to cast vote' });
      }
    }
      
    if (result.success) {
      return res.status(200).json({ success: 'Vote cast successfully', ballot_id: bid });
    } else {
      return res.status(500).json({ error: 'Failed to cast vote' });
    }
  }
}
const voteService = Container.get(VoteService);
const homeService = Container.get(HomeService);
const memberService = Container.get(MemberService);
export const voteController = new VoteController(
  voteService,
  homeService,
  memberService,
);
