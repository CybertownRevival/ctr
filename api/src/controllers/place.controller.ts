import { Request, Response} from 'express';


import { db } from '../db';

class PlaceController {

  constructor() {}

  public async getPlace(request: Request, response: Response): Promise<void> {
    const { slug } = request.params;
    try {
      const place = await db.place.get(slug);
      response.status(200).json({ place });
    } catch (error) {
      response.status(400).json({ error });
    }
  }

  public async getPlaceObjects(request: Request, response: Response): Promise<void> {
    const { slug } = request.params;
    try {
      const place = await db.place.get(slug);
      const objects = await db.objectInstance.forPlace(place.id);
      response.status(200).json({ object_instance: objects });
    } catch (error) {
      response.status(400).json({ error });
    }
  }
}
export const placeController = new PlaceController();
