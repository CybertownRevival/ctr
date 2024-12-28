import {Request, response, Response} from 'express';
import { PlaceService, MemberService } from '../services';
import { Container } from 'typedi';

import * as badwords from 'badwords-list';

class PlaceController {
  constructor(private placeService: PlaceService, private memberService: MemberService) {}

  /** Get Admin status for the specific place's slug */
  public async canAdmin(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;
    const { slug} = request.params;
    const { id } = request.params;

    if (!slug || typeof slug !== 'string') {
      response.status(400).json({ error: 'invalid or missing place slug' });
    }

    // the following is needed to make sure shops find the mall's place id
    let place_id = 0;
    if (id === undefined) {
      const place = await this.placeService.findBySlug(slug);
      place_id = place.id;
    } else {
      place_id = Number.parseInt(id);
    }

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session) {
        response.status(400).json({
          error: 'Invalid or missing token.',
        });
        return;
      }
      const result = await this.placeService.canAdmin(slug, place_id, session.id);
      console.log(result);
      response.status(200).json({ result });
      return;
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  /** Get if user can manage access rights */
  public async canManageAccess(request: Request, response: Response): Promise<void> {
    const { id } = request.params;
    const { apitoken } = request.headers;
    const { slug } = request.params;

    if (!slug || typeof slug !== 'string') {
      response.status(400).json({ error: 'invalid or missing place slug' });
    }

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.placeService.canManageAccess(slug, parseInt(id), session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token.',
        });
        return;
      }
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  /** get users that are assigned access to the place */
  public async getAccessInfoByUsername(request: Request, response: Response): Promise<any> {
    const { id } = request.params;
    const { apitoken } = request.headers;
    const { slug } = request.params;
    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.placeService.canManageAccess(slug, parseInt(id), session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token.',
        });
        return;
      }
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
    try {
      const data = await this.placeService.getAccessInfoByUsername(slug, parseInt(id));
      response.status(200).json({ data });
    } catch (error) {
      console.log(error);
      response.status(400).json({ error });
    }
  }

  public async getSecurityInfo(request: Request, response: Response): Promise<any> {
    const { apitoken } = request.headers;
    const session = this.memberService.decodeMemberToken(<string> apitoken);
    if (!session) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
      return;
    }
    const securityInfo = await this.placeService.getSecurityInfo();
    response.status(200).json({ securityInfo });
  }

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

  public async postAccessInfo(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;
    const { slug } = request.params;
    const session = this.memberService.decodeMemberToken(<string> apitoken);
    if(!session) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
      return;
    }
    const { id } = request.params;
    try {
      const access = await this.placeService.canManageAccess(slug, parseInt(id), session.id);
      if (!access) {
        response.status(403).json({error: 'Access Denied'});
        return;
      }
    } catch (error) {
      console.log(error);
    }
    const deputies = request.body.deputies;
    const owner = request.body.owner;
    try {
      await this.placeService.postAccessInfo(slug, parseInt(id), deputies, owner);
      response.status(200).json({success: true});
    } catch (error) {
      console.log(error.message);
      response.status(400).json({ error: error.message });
    }
  }
}

const placeService = Container.get(PlaceService);
const memberService = Container.get(MemberService);
export const placeController = new PlaceController(placeService, memberService);
