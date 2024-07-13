import { Request, Response } from 'express';
import { PlaceService, MemberService } from '../services';
import { Container } from 'typedi';

import * as badwords from 'badwords-list';

class PlaceController {
  constructor(private placeService: PlaceService, private memberService: MemberService) {}

  /** Provides data about the place with the given slug */
  public async getPlace(request: Request, response: Response): Promise<void> {
    const { slug } = request.params;
    try {
      const place = await this.placeService.findBySlug(slug);
      response.status(200).json({ place });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async getPlaceById(request: Request, response: Response): Promise<void> {
    try {
      const place = await this.placeService.findById(parseInt(request.params.id));
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

  public async addStorage(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if(!session) return;
    try {
      let storageName = request.body.name.toString();
      storageName = storageName.replace(/[^0-9a-zA-Z \-[\]/()]/g, '');
      const bannedwords = badwords.regex;
      if(storageName.match(bannedwords)){
        throw new Error('You can not use this language on CTR!');  
      }
      await this.placeService.addStorage(storageName, session.id);
      response.status(200).json({status: 'success'});
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: error.message });
    }
  }
}
const placeService = Container.get(PlaceService);
const memberService = Container.get(MemberService);
export const placeController = new PlaceController(placeService, memberService);
