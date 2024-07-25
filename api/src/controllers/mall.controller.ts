import { Request, Response } from 'express';
import { Container } from 'typedi';

import {
  MemberService,
  MallService,
  ObjectService,
  WalletService,
  ObjectInstanceService,
} from '../services';

class MallController {
  constructor(
    private memberService: MemberService,
    private mallService: MallService,
    private objectService: ObjectService,
    private walletService: WalletService,
    private objectInstanceService: ObjectInstanceService,
  ) {}

  public async canAdmin(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.mallService.canAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async findStores(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;

    try{
      const stores = await this.mallService.getMallStores();
      response.status(200).json({ status: 'success', stores: stores });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }

  }

  public async findAllObjects(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.mallService.canAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }
      const columnValues = ['id', 'member_id', 'name', 'status'];
      const compareValues = ['=', '!=', '>', '<', '>=', '<='];
      
      const column = request.query.column.toString();
      const compare = request.query.compare.toString();
      const content = request.query.content.toString();

      if(columnValues.includes(column) && compareValues.includes(compare)){
        const objects = await this.mallService
          .getAllObjects(
            column,
            compare,
            content,
            Number(request.query.limit), 
            Number(request.query.offset), 
          );
        response.status(200).json({ status: 'success', objects: objects });
      } else {
        response.status(400).json({ status: 'Failed: Invalid search params'});
      } 
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }

  }

  public async objectsPendingApproval(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.mallService.canAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }
      const objects = await this.objectService.getPendingObjects();
      const returnObjects = [];

      for (const obj of objects) {
        const member = await this.memberService.find({ id: obj.member_id });
        obj.username = member.username;
        returnObjects.push(obj);
      }
      response.status(200).json({ status: 'success', objects: returnObjects });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async approveObject(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.mallService.canAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }

      this.objectService.updateStatusApproved(
        parseInt(request.body.objectId));
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async dropMallObject(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.mallService.canAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }

      await this.objectService.updateObjectPlace(
        parseInt(request.body.objectId),parseInt(request.body.shopId));
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async removeMallObject(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.mallService.canAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }

      this.objectService.removeMallObject(
        parseInt(request.body.objectId));
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async deleteMallObject(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.mallService.canAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }

      this.objectService.deleteMallObject(
        parseInt(request.body.objectId));
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async updateObjectLimit(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.mallService.canAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }

      this.objectService.updateObjectLimit(
        parseInt(request.body.objectId),request.body.limit);
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async updateObjectName(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.mallService.canAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }

      this.objectService.updateObjectName(
        parseInt(request.body.objectId),request.body.name);
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async rejectObject(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.mallService.canAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }

      const objectRecord = await this.objectService.findById(parseInt(request.body.id));
      if (!objectRecord) {
        response.status(400).json({
          error: 'Invalid or missing object id.',
        });
        return;
      }

      const sellersFee = await this.objectService.getSellerFee(
        objectRecord.quantity,
        objectRecord.price,
      );

      this.objectService.updateStatusRejected(objectRecord.id);

      this.objectService.performObjectUploadRefundTransaction(objectRecord.member_id, sellersFee);
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async refundUnsoldInstances(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;

    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.mallService.canAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }

      const objectRecord = await this.objectService.findById(parseInt(request.body.id));
      if (!objectRecord) {
        response.status(400).json({
          error: 'Invalid or missing object id.',
        });
        return;
      }

      const instances = await this.objectInstanceService.countById(objectRecord.id);
      const unsoldInstances = objectRecord.quantity - instances;
      const newQuantity = objectRecord.quantity - unsoldInstances;

      const sellersFee = await this.objectService.getSellerFee(
        unsoldInstances,
        objectRecord.price,
      );

      this.objectService.updateObjectQuantity(objectRecord.id, newQuantity);

      this.objectService.performUnsoldObjectRefundTransaction(objectRecord.member_id, sellersFee);
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async objectsForSale(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;
    try {
      const placeId = parseInt(request.params.id);
      const objects = await this.objectService.getMallForSaleObjects(placeId);
      response.status(200).json({ status: 'success', objects: objects });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async findByObjectId(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;
    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }
      const object = await this.objectService.findByObjectId(parseInt(request.params.id));
      response.status(200).json({ status: 'success', object: object });
    } catch(error){
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async findStore(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;
    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }
      const place = await this.mallService.getStore(parseInt(request.params.id));
      response.status(200).json({ status: 'success', place: place });
    } catch(error){
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async findByUsername(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;
    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }
      const object = await this.objectService.findByUsername(request.params.username);
      response.status(200).json({ status: 'success', object: object });
    } catch(error){
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async updateObjectPosition(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session || !(await this.mallService.canAdmin(session.id))) {
      response.status(400).json({
        error: 'Invalid or missing token or access denied.',
      });
      return;
    }
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

      await this.mallService.updateObjectPlacement(
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

  public async buyObject(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;

    try {
      const isForSale = await this.mallService.isObjectAvailable(request.body.id);
      if (!isForSale) {
        response.status(400).json({
          error: 'Object is no longer available.',
        });
        return;
      }

      const object = await this.objectService.findById(request.body.id);
      const member = await this.memberService.find({ id: session.id });
      const wallet = await this.walletService.findById(member.wallet_id);
      if (object.price > wallet.balance) {
        response.status(400).json({
          error: 'Not enough funds to buy this object.',
        });
        return;
      }

      await this.objectInstanceService.add(object, session.id);
      await this.objectService.performObjectPurchaseTransaction(session.id, object.price);
      await this.objectService.performObjectProfitTransaction(object.member_id, object.price);

      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }
}
const memberService = Container.get(MemberService);
const mallService = Container.get(MallService);
const objectService = Container.get(ObjectService);
const walletService = Container.get(WalletService);
const objectInstanceService = Container.get(ObjectInstanceService);
export const mallController = new MallController(
  memberService,
  mallService,
  objectService,
  walletService,
  objectInstanceService,
);

