import { Request, Response } from 'express';
import { Container } from 'typedi';
import { PlaceService, ColonyService, MemberService } from '../services';

class ColonyController {
  constructor(
    private placeService: PlaceService,
    private colonyService: ColonyService,
    private memberService: MemberService,
  ) {}

  public async getHoods(request: Request, response: Response): Promise<void> {
    const { slug } = request.params;
    try {
      const colony = await this.placeService.findBySlug(slug);
      const hoods = await this.colonyService.getHoods(colony.id);

      response.status(200).json({ hoods });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }
  public async getAccessInfoByUsername(request: Request, response: Response): Promise<any> {
    const { id } = request.params;
    try {
      const data = await this.colonyService.getAccessInfoByUsername(parseInt(id));
      response.status(200).json({ data });
    } catch (error) {
      console.log(error);
      response.status(400).json({ error });
    }
  }
  public async postAccessInfo(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;
    const session = this.memberService.decodeMemberToken(<string> apitoken);
    if(!session) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
      return;
    }
    const { id } = request.params;
    try {
      const access = await this.colonyService.canManageAccess(parseInt(id), session.id);
      if (!access) {
        response.status(403).json({error: 'Access Denied'});
        return;
      }
    } catch (error) {
      console.log(error);
    }
    const deputies = request.body.deputies;
    const owner = request.body.owner;
    try {
      await this.colonyService.postAccessInfo(parseInt(id), deputies, owner);
      response.status(200).json({success: true});
    } catch (error) {
      console.log(error);
    }
  }
  
  public async canAdmin(request: Request, response: Response): Promise<void> {
    const { id } = request.params;
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session) {
        response.status(400).json({
          error: 'Invalid or missing token.',
        });
        return;
      } else if (!(await this.colonyService.canAdmin(Number.parseInt(id), session.id))) {
        response.status(403).json({ result: false });
        return;
      } else {
        response.status(200).json({result: true});
      }
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async canManageAccess(request: Request, response: Response): Promise<void> {
    const { id } = request.params;
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.colonyService.canManageAccess(parseInt(id), session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token.',
        });
        return;
      }
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }
}
const placeService = Container.get(PlaceService);
const colonyService = Container.get(ColonyService);
const memberService = Container.get(MemberService);
export const colonyController = new ColonyController(placeService, colonyService, memberService);
