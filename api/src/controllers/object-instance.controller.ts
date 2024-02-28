import { Request, Response } from 'express';
import { Container } from 'typedi';
import { MemberService, ObjectInstanceService, PlaceService } from '../services';

class ObjectInstanceController {
  constructor(
    private objectInstanceService: ObjectInstanceService,
    private placeService: PlaceService,
    private memberService: MemberService,
  ) {}

  /** Stores the position of an object instance in the database */
  public async updateObjectInstancePosition(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;

    try {
      if (
        typeof request.body?.position.x === 'undefined' ||
        typeof request.body?.position.y === 'undefined' ||
        typeof request.body?.position.z === 'undefined' ||
        typeof request.body?.rotation.x === 'undefined' ||
        typeof request.body?.rotation.y === 'undefined' ||
        typeof request.body?.rotation.z === 'undefined' ||
        typeof request.body?.rotation.angle === 'undefined'
      ) {
        throw new Error('Invalid position or rotation.');
      }

      const id = Number.parseInt(request.params.id);
      const objectInstance = await this.objectInstanceService.find(id);
      if (objectInstance.member_id != session.id) {
        throw new Error('Not the owner of this object');
      }

      await this.objectInstanceService.updateObjectPlacement(
        id,
        request.body.position,
        request.body.rotation,
      );

      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: error.message });
    }
  }

  public async dropObjectInstance(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;

    try {
      if (
        typeof request.body?.position.x === 'undefined' ||
        typeof request.body?.position.y === 'undefined' ||
        typeof request.body?.position.z === 'undefined' ||
        typeof request.body?.rotation.x === 'undefined' ||
        typeof request.body?.rotation.y === 'undefined' ||
        typeof request.body?.rotation.z === 'undefined' ||
        typeof request.body?.rotation.angle === 'undefined'
      ) {
        throw new Error('Invalid placeId, position or rotation.');
      }

      const id = Number.parseInt(request.params.id);
      const objectInstance = await this.objectInstanceService.find(id);
      const place = await this.placeService.findById(Number.parseInt(request.body.placeId));

      if (place.member_id != session.id) {
        throw new Error('Not the owner of this place');
      }

      if (objectInstance.member_id != session.id) {
        throw new Error('Not the owner of this object');
      }

      await this.objectInstanceService.updateObjectPlaceId(id, request.body.placeId);
      await this.objectInstanceService.updateObjectPlacement(
        id,
        request.body.position,
        request.body.rotation,
      );
      const [objectInstanceData] = await this.objectInstanceService.getObjectInstanceWithObject(id);

      response.status(200).json({ status: 'success', object_instance: objectInstanceData });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: error.message });
    }
  }

  public async updateObjectInstance(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;
    const session = this.memberService.decodeMemberToken(<string> apitoken);
    if(!session) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
      return;
    }

  
    const objectInstance = await this.objectInstanceService.find(request.body.id);
    if (objectInstance.member_id != session.id) {
      throw new Error('You do not own this object!');
    }

    const objectId = Number.parseInt(request.body.id);
    let objectName = request.body.name;
    const objectPrice = request.body.price;
    const objectBuyer = request.body.buyer;

    if(
      objectName.length === 0 || 
      objectName === 'undefined'){
      objectName = null;
    }
    if(objectName === null){
      throw new Error('Object must have a name.');
    }
    
    if(objectName !== null){
      await this.objectInstanceService.updateObjectInstanceName(objectId, objectName);
      await this.objectInstanceService.updateObjectInstancePrice(objectId, objectPrice);
      await this.objectInstanceService.updateObjectInstanceBuyer(objectId, objectBuyer);
    }
  }

  public async openObjectProperties(request: Request, response: Response): Promise<void>{
    const session = this.memberService.decryptSession(request, response);
    if(!session) return;
    try {
      const id = Number.parseInt(request.params.id);
      const objectInstance = await this.objectInstanceService.getObjectInstanceWithObject(id);
      response.status(200).json({objectInstance});
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: error.message });
    }
  }

  public async pickUpObjectInstance(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;

    try {
      const id = Number.parseInt(request.params.id);
      const objectInstance = await this.objectInstanceService.find(id);

      if (objectInstance.member_id != session.id) {
        throw new Error('Not the owner of this object');
      }
      await this.objectInstanceService.updateObjectPlaceId(id, 0);
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: error.message });
    }
  }
}
const objectInstanceService = Container.get(ObjectInstanceService);
const placeService = Container.get(PlaceService);
const memberService = Container.get(MemberService);
export const objectInstanceController = new ObjectInstanceController(
  objectInstanceService,
  placeService,
  memberService,
);
