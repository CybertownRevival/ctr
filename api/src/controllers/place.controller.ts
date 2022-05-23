import { Request, Response} from 'express';

import { db } from '../db';

class PlaceController {

  constructor() {}

  /** Provides data about the place with the given slug */
  public async getPlace(request: Request, response: Response): Promise<void> {
    const { slug } = request.params;
    try {
      const [place] = await db.place.where({ slug });
      response.status(200).json({ place });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  /** Provides data about objects present in the place with the given slug */
  public async getPlaceObjects(request: Request, response: Response): Promise<void> {
    const { slug } = request.params;
    try {
      const [place] = await db.place.where({ slug });
      const objects = await db.objectInstance.where({ place_id: place.id });
      response.status(200).json({ object_instance: objects });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }
}
export const placeController = new PlaceController();
