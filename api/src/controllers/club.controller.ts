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
  ) {}

  public async createClub(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) {
      response.status(401).json({message: 'Session not found or invalid'});
      return;
    }
    const {name, description, type} = request.body;
    const club = await this.clubService.createClub(session.id, name, description, type);
    if (!club) {
      response.status(400).send({message: 'Error creating club'});
      return;
    }
    response.status(200).send({success: club});
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
    try {
      const results = await this.clubService.searchClubs(
        request.query.search.toString(),
        Number.parseInt(request.query.limit.toString()),
        Number.parseInt(request.query.offset.toString()),
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
export const clubController = new ClubController(
  clubService,
  memberService,
);
