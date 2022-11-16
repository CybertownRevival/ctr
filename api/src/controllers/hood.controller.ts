import { Request, Response} from 'express';

import {db, knex} from '../db';

class HoodController {

  constructor() {}

  public async getHood(request: Request, response: Response): Promise<void> {
    const { id } = request.params;
    try {
      const [hood] = await db.place.where({ 'id': parseInt(id) });
      const [mapLocation] = await db.mapLocation.where({ 'place_id': parseInt(id) });
      const [colony] = await db.place.where({ 'id': mapLocation.parent_place_id });

      response.status(200).json({ hood: hood, colony: colony });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async getBlocks(request: Request, response: Response): Promise<void> {
    const { id } = request.params;
    try {

      const blocks = await knex
        .select('place.id',
          'place.name',
          'map_location.location',
        )
        .from('place')
        .innerJoin('map_location', 'map_location.place_id', 'place.id')
        .where('map_location.parent_place_id', id)
        .orderBy('map_location.location');

      response.status(200).json({ blocks });

    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

}
export const hoodController = new HoodController();
