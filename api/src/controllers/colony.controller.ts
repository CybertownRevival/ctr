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
  public async canAdmin(request: Request, response: Response): Promise<void> {
    const { slug } = request.params;
    const { apitoken } = request.headers;

    try {
      const colony = await this.placeService.findBySlug(slug);
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.colonyService.canAdmin(colony.id, session.id))) {
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

  public async canManageAccess(request: Request, response: Response): Promise<void> {
    const { slug } = request.params;
    const { apitoken } = request.headers;

    try {
      const colony = await this.placeService.findBySlug(slug);
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.colonyService.canManageAccess(colony.id, session.id))) {
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
