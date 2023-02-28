import { Request, Response} from 'express';
import { Container } from 'typedi';

import {db} from '../db';
import { MemberService, BlockService } from '../services';

class BlockController {

  constructor(
    private memberService: MemberService,
    private blockService: BlockService,
  ) {}

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

      await db.mapLocation
        .update({available: false })
        .where({ parent_place_id: parseInt(id) });

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
const memberService = Container.get(MemberService);
const blockService = Container.get(BlockService);
export const blockController = new BlockController(memberService, blockService);
