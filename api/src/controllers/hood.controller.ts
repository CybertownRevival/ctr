import { Request, Response} from 'express';
import {HoodService} from '../services';
import {Container} from 'typedi';

class HoodController {

  constructor(
    private hoodService: HoodService,
  ) {}

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

}
const hoodService = Container.get(HoodService);
export const hoodController = new HoodController(hoodService);
