import { Request, Response } from 'express';
import { HoodService, MemberService } from '../services';
import { Container } from 'typedi';

class HoodController {
  constructor(private hoodService: HoodService, private memberService: MemberService) {}

  public async getHood(request: Request, response: Response): Promise<void> {
    const { id } = request.params;
    try {
      const hood = await this.hoodService.find(parseInt(id));
      const colony = await this.hoodService.getColony(parseInt(id));

      response.status(200).json({ hood: hood, colony: colony });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async getBlocks(request: Request, response: Response): Promise<void> {
    const { id } = request.params;
    try {
      const blocks = await this.hoodService.getBlocks(parseInt(id));
      response.status(200).json({ blocks });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }
  
  public async getAccessInfoByUsername(request: Request, response: Response): Promise<any> {
    const { id } = request.params;
    try {
      const data = await this.hoodService.getAccessInfoByUsername(parseInt(id));
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
      const access = await this.hoodService.canManageAccess(parseInt(id), session.id);
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
      await this.hoodService.postAccessInfo(parseInt(id), deputies, owner);
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
      } else if (!(await this.hoodService.canAdmin(parseInt(id), session.id))) {
        response.status(403).json({result: false});
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
      if (!session || !(await this.hoodService.canManageAccess(parseInt(id), session.id))) {
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
const hoodService = Container.get(HoodService);
const memberService = Container.get(MemberService);
export const hoodController = new HoodController(hoodService, memberService);
