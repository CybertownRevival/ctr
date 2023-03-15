import { Request, Response} from 'express';
import { Container } from 'typedi';

import { MemberService, BlockService, HoodService } from '../services';

class BlockController {

  constructor(
    private memberService: MemberService,
    private blockService: BlockService,
    private hoodService: HoodService,
  ) {}

  public async getBlock(request: Request, response: Response): Promise<void> {
    const { id } = request.params;
    try {
      const block = await this.blockService.find(parseInt(id));
      const hood = await this.blockService.getHood(parseInt(id));
      const colony = await this.hoodService.getColony(hood.id);
      response.status(200).json({ block: block, hood: hood, colony: colony });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async getLocations(request: Request, response: Response): Promise<void> {
    const { id } = request.params;
    try {
      const locations = await this.blockService
        .getMapLocationAndPlaces(parseInt(id));
      response.status(200).json({ locations });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async postLocations(request: Request, response: Response): Promise<void> {
    const { id } = request.params;
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string> apitoken);
      if (!session || !(await this.memberService.isAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token.',
        });
      }

      const { availableLocations } = request.body;

      await this.blockService.resetMapLocationAvailability(parseInt(id));

      for(const location of availableLocations) {
        await this.blockService.setMapLocationAvailable(parseInt(id), location);
      }

      response.status(200).json({'status': 'success'});

    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }
}
const memberService = Container.get(MemberService);
const blockService = Container.get(BlockService);
const hoodService = Container.get(HoodService);
export const blockController = new BlockController(memberService, blockService, hoodService);
