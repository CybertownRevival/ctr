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
  ) { }

  // Required experience points to be eligible to vote
  public static readonly REQUIRED_EXPERIENCE = 1000;
  // Voting starts on March 13, 2026 at 12:00 AM EDT
  public static readonly VOTING_START_DATE = new Date('2026-03-23T00:00:00-04:00');
  // Voting ends on March 20, 2026 at 11:59 PM EDT
  public static readonly VOTING_END_DATE = new Date('2026-03-30T23:59:59-04:00');
  // created date for new members to be eligible to vote
  public static readonly REQUIRED_MEMBER_IMMIGRATION_DATE = new Date('2025-10-01T23:59:59-04:00');

  // method for handling casting a vote
  async castMayorVote(req: Request, res: Response) {
    const { apitoken, bid } = req.headers;
    const { optionPicked, voteId } = req.body;

    // Validate input
    if (!optionPicked || !voteId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if voting is currently open
    const now = new Date();
    if (now <= VoteController.VOTING_START_DATE || now >= VoteController.VOTING_END_DATE) {
      return res.status(403).json({
        error: 'Voting will open on March 23, 2026 and will close on March 30, 2026',
      });
    }

    // Get user ID from request
    const session = this.memberService.decodeMemberToken(<string>apitoken);
    if (!session || !session.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has the required immigration date to vote
    const member = await this.memberService.find({ id: session.id });
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    // convert date from database to edt
    const immigrationDate = new Date(member.created_at)
      .toLocaleString('en-US', { timeZone: 'America/New_York' });
    if (new Date(immigrationDate) > VoteController.REQUIRED_MEMBER_IMMIGRATION_DATE) {
      return res.status(403).json({
        error: 'You must be a citizen of Cybertown prior to October 1, 2025 to vote. ' +
          `Your immigration date is ${immigrationDate}.`,
      });
    }

    // Check if user owns a home
    if (!this.homeService.getHome(session.id)) {
      return res.status(403).json({ error: 'Owning a home is required to vote' });
    }

    // Cast the vote using the service
    let currentBid = typeof bid === 'string' ? bid : null;
    if (!currentBid) {
      currentBid = await this.memberService.getBid(session.id);
      try {
        await this.voteService.castMayorVote(1, session.id, optionPicked, voteId, currentBid);
      } catch (error) {
        console.error('Error casting vote with new bid:', error);
        return res.status(500).json({ error: 'Failed to cast vote' });
      }
    } else {
      try {
        await this.voteService.castMayorVote(0, session.id, optionPicked, voteId, currentBid);
      } catch (error) {
        console.error('Error casting vote with existing bid:', error);
        return res.status(500).json({ error: 'Failed to cast vote' });
      }
    }

    return res.status(200).json({ success: 'Vote cast successfully', ballot_id: currentBid });
  }

  async checkIfEligibleToVote(req: Request, res: Response) {
    const { apitoken } = req.headers;

    // Check if voting is currently open
    const now = new Date();
    if (now <= VoteController.VOTING_START_DATE || now >= VoteController.VOTING_END_DATE) {
      return res.status(403).json({
        error: 'Voting will open on March 23, 2026 and will close on March 30, 2026',
      });
    }

    // Get user ID from request
    const session = this.memberService.decodeMemberToken(<string>apitoken);
    if (!session || !session.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has the required immigration date to vote
    const member = await this.memberService.find({ id: session.id });
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    // convert date from database to edt
    const immigrationDate = new Date(member.created_at)
      .toLocaleString('en-US', { timeZone: 'America/New_York' });
    if (new Date(immigrationDate) > VoteController.REQUIRED_MEMBER_IMMIGRATION_DATE) {
      return res.status(403).json({
        error: 'You must be a citizen of Cybertown prior to October 1, 2025 to vote. ' +
          `Your immigration date is ${immigrationDate}.`,
      });
    }

    // Check if user owns a home
    if (!this.homeService.getHome(session.id)) {
      return res.status(403).json({ error: 'Owning a home is required to vote' });
    }

    return res.status(200).json({ eligible: true });
  }

  async checkIfVoted(req: Request, res: Response) {
    const { apitoken } = req.headers;
    const voteId = parseInt(req.params.voteId);

    if (isNaN(voteId)) {
      return res.status(400).json({ error: 'Invalid voteId' });
    }

    // Get user ID from request
    const session = this.memberService.decodeMemberToken(<string>apitoken);
    if (!session || !session.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has already voted
    const voted = await this.voteService.checkIfVoted(session.id, voteId);
    if (voted) {
      return res.status(200).json({ voted: true });
    } else {
      return res.status(200).json({ voted: false });
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
