import { Request, Response} from 'express';

import {db, knex} from '../db';

class BlockController {

  constructor() {}

  public async getBlock(request: Request, response: Response): Promise<void> {
    const { id } = request.params;
    try {
      const [block] = await db.place.where({ 'id': parseInt(id) });
      const [mapLocation] = await db.mapLocation.where({ 'place_id': parseInt(id) });

      const [hood] = await db.place.where({ 'id': mapLocation.parent_place_id });
      const [hoodMapLocation] = await db.mapLocation.where({ 'place_id': hood.id });

      const [colony] = await db.place.where({ 'id': hoodMapLocation.parent_place_id });

      response.status(200).json({ block: block, hood: hood, colony: colony });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async getLocations(request: Request, response: Response): Promise<void> {
    const { id } = request.params;
    try {

      const locations = await knex
        .select('place.id',
          'place.name',
          'map_location.location',
        )
        .from('place')
        .innerJoin('map_location', 'map_location.place_id', 'place.id')
        .where('map_location.parent_place_id', id)
        .orderBy('map_location.location');

      response.status(200).json({ locations });

    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

}
export const blockController = new BlockController();
