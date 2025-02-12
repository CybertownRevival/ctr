import {Request, Response} from 'express';
import { Container } from 'typedi';
import {
  ClubService,
  MemberService,
  PlaceService,
} from '../services/';

class ClubController {
  constructor(
    private clubService: ClubService,
    private memberService: MemberService,
    private placeService: PlaceService,
  ) {}
  
  public async checkMembership(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) {
      response.status(401).json({message: 'Session not found or invalid'});
      return;
    }
    const clubId = Number.parseInt(request.query.clubId.toString());
    try {
      const canAdmin = await this.placeService.canAdmin('personalclub', clubId, session.id);
      if (canAdmin) {
        response.status(200).json({isMember: true});
        return;
      }
    } catch (error) {
      console.log(error);
    }
    try {
      const isMember = await this.clubService.checkClubMembership();
      let currentMember = false;
      for (const member of isMember) {
        if(member.member_id === session.id && member.club_id === clubId){
          currentMember = true;
        }
      }
      response.status(200).json({isMember: currentMember});
    } catch (error) {
      console.log(error);
      response.status(400).json({message: error.message});
    }
  }

  public async createClub(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) {
      response.status(401).json({message: 'Session not found or invalid'});
      return;
    }
    const {name, description, type} = request.body;
    try {
      const club = await this.clubService.createClub(session.id, name, description, type);
      response.status(200).json({success: club});
    } catch (error) {
      console.log(error);
      response.status(400).json({'error': error.message});
    }
  }
  
  public async changeMemberStatus(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) {
      response.status(401).json({message: 'Session not found or invalid'});
      return;
    }
    const clubId = Number.parseInt(request.body.clubId);
    const username = request.body.username;
    const status = request.body.status;
    const memberId = await this.memberService.getMemberId(username);
    try {
      await this.clubService.changeMemberStatus(clubId, memberId[0].id, status);
      console.log(`changed member ${memberId[0].id} status ${status} for club ${clubId}`);
      response.status(200).json({success: true});
    } catch (error) {
      console.log(error);
      response.status(400).json({message: error.message});
    }
  }

  public async deleteClub(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) {
      response.status(401).send();
      return;
    }
    const clubId = Number.parseInt(request.body.clubId);
    const canAdmin = await this.placeService.canAdmin('clubs', clubId, session.id);
    console.log(`canAdmin: ${canAdmin}`);
    
    if (canAdmin) {
      try {
        await this.clubService.deleteClub(clubId);
        response.status(200).json({success: true});
        return;
      } catch (error) {
        console.log(error);
        response.status(400).json({message: error.message});
        return;
      }
    }
  }
  
  public async getClubMemberCount(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) {
      response.status(401).send();
      return;
    }
    const clubId = Number.parseInt(request.query.clubId.toString());
    try {
      const count = await this.clubService.getMemberCount(clubId);
      response.status(200).json({count});
    } catch (error) {
      console.log(error);
      response.status(400).json({message: error.message});
    }
  }
  
  //get members of a club
  public async getClubMembers(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) {
      response.status(401).json({message: 'Session not found or invalid'});
      return;
    }
    const clubId = Number.parseInt(request.query.clubId.toString());
    const status = request.query.status.toString();
    const limit = Number.parseInt(request.query.limit.toString());
    const offset = Number.parseInt(request.query.offset.toString());
    try {
      const results = await this.clubService.getMembers(clubId, status, limit, offset);
      response.status(200).json({results});
    } catch (error) {
      console.log(error);
      response.status(400).json({message: error.message});
    }
  }
  
  public async getMemberStatus(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) {
      response.status(401).json({message: 'Session not found or invalid'});
      return;
    }
    const clubId = Number.parseInt(request.query.clubId.toString());
    try {
      const status = await this.clubService.getMemberStatus(session.id, clubId);
      response.status(200).json({status});
    } catch (error) {
      console.log(error);
      response.status(400).json({message: error.message});
    }
  }
  
  public async joinClub(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) {
      response.status(401).json({message: 'Session not found or invalid'});
      return;
    }
    const clubId = Number.parseInt(request.body.clubId);
    try {
      await this.clubService.joinClub(clubId, session.id);
      response.status(200).json({success: true});
    } catch (error) {
      console.log(error);
      response.status(400).json({message: error.message});
    }
  }

  public async updateClub(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) {
      response.status(401).send();
      return;
    }
  }

  public async searchClubs(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) {
      response.status(401).send();
      return;
    }
    try {
      const results = await this.clubService.searchClubs(
        request.query.search.toString(),
        Number.parseInt(request.query.limit.toString()),
        Number.parseInt(request.query.offset.toString()),
        request.query.orderBy.toString(),
        request.query.order.toString(),
      );
      response.status(200).json({results});
    } catch (error) {
      console.log(error);
      response.status(400).json({error});
    }
  }
}

const clubService = Container.get(ClubService);
const memberService = Container.get(MemberService);
const placeService = Container.get(PlaceService);
export const clubController = new ClubController(
  clubService,
  memberService,
  placeService,
);
