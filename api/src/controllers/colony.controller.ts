import { Request, Response} from 'express';

import {db, knex} from '../db';

class ColonyController {

  constructor() {}

  public async getHoods(request: Request, response: Response): Promise<void> {
    const { slug } = request.params;
    try {

      const hoods = await knex
        .select('place.id',
          'place.name',
          'map_location.location',
        )
        .from('place')
        .innerJoin('map_location', 'map_location.place_id', 'place.id')
        .innerJoin('place as colony', 'map_location.parent_place_id', 'colony.id')
        .where('colony.slug', slug)
        .orderBy('map_location.location');

      response.status(200).json({ hoods });

    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

}
export const colonyController = new ColonyController();
