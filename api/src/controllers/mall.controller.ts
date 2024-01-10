import { Request, Response } from 'express';
import { Container } from 'typedi';

import { MemberService, MallService, ObjectService } from '../services';

class MallController {
  constructor(
    private memberService: MemberService,
    private mallService: MallService,
    private objectService: ObjectService,
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

      // TODO: update the status of the object to approved + expiration date

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
}
const memberService = Container.get(MemberService);
const mallService = Container.get(MallService);
const objectService = Container.get(ObjectService);
export const mallController = new MallController(memberService, mallService, objectService);
