import { Request, Response} from 'express';
import { PlaceService } from '../services';
import {Container} from 'typedi';

class PlaceController {

  constructor(
    private placeService: PlaceService,
  ) {}

  /** Provides data about the place with the given slug */
  public async getPlace(request: Request, response: Response): Promise<void> {
    const { slug } = request.params;
    try {
      const place = await this.placeService.fundBySlug(slug);
      response.status(200).json({ place });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  /** Provides data about objects present in the place with the given slug */
  public async getPlaceObjects(request: Request, response: Response): Promise<void> {
    const { placeId } = request.params;
    try {
      const objects = await this.placeService.getPlaceObjects(parseInt(placeId));
      response.status(200).json({ object_instance: objects });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: error.message });
    }
  }
}
const placeService = Container.get(PlaceService);
export const placeController = new PlaceController(placeService);
