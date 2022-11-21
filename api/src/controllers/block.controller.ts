import { Request, Response} from 'express';

import {db, knex} from '../db';
import { MemberService } from '../services/member.service';
import {member} from '../libs';

class BlockController {

  constructor(private memberService: MemberService) {}

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
        .select(
          'map_location.location',
          'map_location.available',
          'place.id',
          'place.name',
        )
        .from('map_location')
        .leftJoin('place', 'map_location.place_id', 'place.id')
        .where('map_location.parent_place_id', id)
        .orderBy('map_location.location');

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

      // todo validate the array of locations
      const { availableLocations } = request.body;

      // todo: unset all 'available'
      await db.mapLocation
        .update({available: false })
        .where({ parent_place_id: parseInt(id) });

      // todo INSERT, on duplicate, update available = 1
      for(const location of availableLocations) {
        await db.mapLocation
          .insert({
            parent_place_id: parseInt(id),
            location: location,
            available: true,
          })
          .onConflict(['parent_place_id','location'])
          .merge(['available']);
      }

      response.status(200).json({'status': 'success'});

    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }
}
const memberService = new MemberService(db);
export const blockController = new BlockController(memberService);
