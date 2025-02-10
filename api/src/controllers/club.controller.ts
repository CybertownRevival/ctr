import {Request, Response} from 'express';
import { Container } from 'typedi';
import {
  ClubService,
  MemberService,
} from '../services/';

class ClubController {
  constructor(
    private clubService: ClubService,
    private memberService: MemberService,
  ) {
  }
  public async getAllClubs(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) {
      response.status(401).send();
      return;
    }
  }

  public async createClub(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) {
      response.status(401).json({message: 'Session not found or invalid'});
      return;
    }
    //get the user's xp if less than 500 throw error
    const userInfo = this.memberService.getMemberInfoPublic(session.id);
    if (userInfo.xp < 500) {
      throw new Error('You need at least 500 xp to create a club!');
      return;
    }
    const {name, description, type} = request.body;
    const club = this.clubService.createClub(name, description, type);
    if (!club) {
      response.status(400).send({message: 'Error creating club'});
      return;
    }
    response.status(200).send({success: 'Club created successfully'});
  }

  public async deleteClub(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) {
      response.status(401).send();
      return;
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
  }
}

const clubService = Container.get(ClubService);
const memberService = Container.get(MemberService);
export const clubController = new ClubController(
  clubService,
  memberService,
);
