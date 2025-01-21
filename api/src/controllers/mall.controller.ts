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

  public async findSoldOutObjects(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;
    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session || !(await this.mallService.canAdmin(session.id))) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }
      const objects = await this.mallService.findSoldOut();
      response.status(200).json({ status: 'success', objects: objects });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async searchMallObjects(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.mallService.canAdmin(session.id);
    if (admin) {
      try {
        const search = request.query.search.toString().replace(/[^0-9a-zA-Z \-[\]/()]/g, '');
        const results = await this.mallService.searchMallObjects(
          search,
          Number.parseInt(request.query.limit.toString()),
          Number.parseInt(request.query.offset.toString()),
        );
        response.status(200).json({results});
      } catch (error) {
        console.log(error);
        response.status(400).json({error});
      }
    } else {
      response.status(403).json({message: 'Access Denied'});
    }
  }

  public async searchAllObjects(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const admin = await this.mallService.canAdmin(session.id);
    if (admin) {
      try {
        const compareValues = ['=', '!=', '>', '<', '>=', '<='];
        const search = request.query.search.toString().replace(/[^0-9a-zA-Z \-[\]/()]/g, '');
        const compare = request.query.compare.toString();
        const status = parseInt(request.query.status.toString());

        if(compareValues.includes(compare)){
          const results = await this.mallService.searchAllObjects(
            search,
            compare,
            status,
            Number.parseInt(request.query.limit.toString()),
            Number.parseInt(request.query.offset.toString()),
          );
          response.status(200).json({results});
        }
      } catch (error) {
        console.log(error);
        response.status(400).json({error});
      }
    } else {
      response.status(403).json({message: 'Access Denied'});
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
      const orderValues = ['ASC', 'DESC'];
      
      const column = request.query.column.toString();
      const compare = request.query.compare.toString();
      const content = request.query.content.toString();
      const order = request.query.orderBy.toString();

      if(columnValues.includes(column) && 
        compareValues.includes(compare) && 
        orderValues.includes(order)){
        const objects = await this.mallService
          .getAllObjects(
            column,
            compare,
            content,
            Number(request.query.limit), 
            Number(request.query.offset),
            order,
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

  public async getObject(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;
    try {
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (!session) {
        response.status(400).json({
          error: 'Invalid or missing token or access denied.',
        });
        return;
      }
      const object = await this.objectService.findById(parseInt(request.params.id));
      const username = await this.memberService.getMemberInfo(object.member_id);
      response.status(200)
        .json({status: 'success', object: object, username: username.username });
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
    const session = this.memberService.decodeMemberToken(<string>apitoken);
    if (!session) {
      response.status(400).json({
        error: 'Invalid or missing token or access denied.',
      });
      return;
    }
    const username = request.body.username;
    const compare = request.body.compare.toString().replace(/[^0-9]/g, '');
    const status = request.body.status.toString().replace(/[^0-9]/g, '');
    const limit = request.body.limit.toString().replace(/[^0-9]/g, '');
    const offset = request.body.offset.toString().replace(/[^0-9]/g, '');
    const compareValues = ['=', '!=', '>', '<', '>=', '<='];
    if(!username || !compare || !status || !limit){
      throw new Error('Missing required search parameters');
    }
    if(compare > '5' || status > '4' || limit < '10'){
      throw new Error('Invalid search parameters');
    }
    try {
      const object = await this.objectService
        .findByUsername(
          username, 
          compareValues[compare], 
          status,
          limit,
          offset);
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

