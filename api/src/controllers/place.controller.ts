import {Request, Response} from 'express';
import { PlaceService, MemberService, HomeService } from '../services';
import { Container } from 'typedi';

import * as badwords from 'badwords-list';
import { Place } from 'models';

class PlaceController {
  constructor(
    private placeService: PlaceService, 
    private memberService: MemberService,
    private homeService: HomeService,
  ) {}

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
      response.status(200).json({ isOwner: true });
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
      if (!session) {
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

  public async getPlaceById(request: Request, response: Response): Promise<Place[]> {
    const session = this.memberService.decryptSession(request, response);
    if(!session) return;
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

  public async deleteStorage(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if(!session) return;
    try {
      const unitID = request.body.id;
      const place = await this.placeService.findById(unitID);
      if(place.member_id === session.id){
        await this.placeService.deleteStorage(unitID);
        response.status(200).json({status: 'success'});
      }
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

  public async addVirtualPet(request: Request, response: Response): Promise<void>{
    const session = this.memberService.decryptSession(request, response);
    if(!session) return;
    try {
      const placeId = Number.parseInt(request.params.place_id);
      const petAdded = await this.placeService.addVirtualPet(placeId);
      response.status(200).json({ success: petAdded });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: error});
    }
  }

  public async updateVirtualPet(request: Request, response: Response): Promise<void>{
    const session = this.memberService.decryptSession(request, response);
    if(!session) return;
    const placeId = Number.parseInt(request.params.place_id);
    const name = request.body.name.toLocaleString();
    const avatar = request.body.avatar.toLocaleString();
    const active = request.body.active;
    const voice = Number.parseInt(request.body.voice.toLocaleString());
    const behaviours = request.body.behaviours.toLocaleString();
    const admin = await this.memberService.getAccessLevel(session.id);
    const bannedwords = badwords.regex;
    const testBehaviours = JSON.parse(behaviours);
    const owner = await this.homeService.getHome(session.id);
    //if(!admin.includes('security') || owner.id !== placeId) return;
    if(name.match(bannedwords)){
      response.status(200).json({ error: 'Pet name cannot contain a banned word.' });
    } else {
      for(let i = 0; i < testBehaviours.length; i++){
        if(
          testBehaviours[i].input.match(bannedwords) ||
          testBehaviours[i].output.match(bannedwords)
        ){
          response.status(200).json({ error: 'Pet input/output cannot contain a banned word.' });
        } else {
          if(admin.includes('security') || owner.id === placeId){
            try {
              await this.placeService
                .updateVirtualPet(placeId, name, avatar, active, voice, behaviours);
              response.status(200).json({ success: 'success' });
            } catch (error) {
              console.error(error);
              response.status(400).json({ error: error});
            }
          } else {
            response.status(200).json({ error: 'You do not have access to update this.' });
          }
        }
      }
    }
  }

  public async getVirtualPet(request: Request, response: Response): Promise<void>{
    const session = this.memberService.decryptSession(request, response);
    if(!session) return;
    try {
      const placeId = Number.parseInt(request.params.place_id);
      const virtualPet = await this.placeService.getVirtualPet(placeId);
      response.status(200).json({ data: virtualPet });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: error});
    }
  }
}

const placeService = Container.get(PlaceService);
const memberService = Container.get(MemberService);
const homeService = Container.get(HomeService);
export const placeController = new PlaceController(placeService, memberService, homeService);
