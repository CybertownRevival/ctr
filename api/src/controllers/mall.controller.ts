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

      this.objectService.updateStatusApproved(parseInt(request.body.id));
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
  public async objectsForSale(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;

    try {
      const objects = await this.objectService.getMallForSaleObjects();
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

  public async buyObject(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;

    try {
      const isForSale = await this.mallService.isObjectAvailable(request.body.id);
      console.log('is for sale', isForSale);
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

