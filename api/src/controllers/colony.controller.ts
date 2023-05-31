import { Request, Response } from 'express';
import { Container } from 'typedi';
import { PlaceService, ColonyService } from '../services';

class ColonyController {
  constructor(private placeService: PlaceService, private colonyService: ColonyService) {}

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
}
const placeService = Container.get(PlaceService);
const colonyService = Container.get(ColonyService);
export const colonyController = new ColonyController(placeService, colonyService);
