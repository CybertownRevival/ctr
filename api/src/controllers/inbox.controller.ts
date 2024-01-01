import {Request, response, Response} from 'express';
import validator from 'validator';
import { Container } from 'typedi';
import { 
  MemberService,
  InboxService,
  ColonyService,
  HoodService,
  BlockService,
} from '../services';
import sanitizeHtml from 'sanitize-html';

class InboxController {
  
  constructor(
   private memberService: MemberService,
   private inboxService: InboxService,
   private colonyService: ColonyService,
   private hoodService: HoodService,
   private blockService: BlockService,
  ) {
  }
  
  public async adminCheck(placeId, id, type): Promise<any> {
    if (type === 'colony') {
      try {
        return await this.colonyService.canAdmin(placeId, id);
      } catch (e) {
        console.log(e);
      }
    } else if (type === 'hood') {
      try {
        return await this.hoodService.canAdmin(placeId, id);
      } catch (e) {
        console.log(e);
      }
    } else if (type === 'block') {
      try {
        return await this.blockService.canAdmin(placeId, id);
      } catch (e) {
        console.log(e);
      }
    } else {
      try {
        return await this.inboxService.getAdminInfo(placeId, id);
      } catch (e) {
        console.log(e);
      }
    }
  }
  public async getAdminInfo(request: Request, response: Response): Promise<any> {
    const placeId = Number.parseInt(request.body.place_id);
    const type = request.body.type;
    const {apitoken} = request.headers;
    const session = this.memberService.decodeMemberToken(<string>apitoken);
    if (!session) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
      return;
    }
    const {id} = session;
    const admin = await this.adminCheck(placeId, id, type);
    response.status(200).json({admin});
  }
  public async getInfo(request: Request, response: Response): Promise<void> {
    const placeId = Number.parseInt(request.body.place_id);
    if (placeId <= 0) {
      response.status(400).json({
        error: 'placeId is required.',
      });
      return;
    }
    try {
      const placeinfo = await this.inboxService.getInfo(placeId);
      response.status(200).json({placeinfo});
    } catch (error) {
      console.log(error);
      response.status(400).json({
        error: 'A problem occurred while trying to fetch place information.',
      });
    }
  }
  
  public async getInboxMessages(request: Request, response: Response): Promise<void> {
    const placeId = Number.parseInt(request.body.place_id);
    if (placeId <= 0) {
      response.status(400).json({
        error: 'placeId is required.',
      });
      return;
    }
    try {
      const inboxmessages = await this.inboxService.getInboxMessages(placeId);
      response.status(200).json({inboxmessages});
    } catch (error) {
      console.log(error);
      response.status(400).json({
        error: 'A problem occurred while trying to fetch inbox messages.',
      });
    }
  }
  
  public async getMessage(request: Request, response: Response): Promise<void> {
    const messageId = Number.parseInt(request.body.message_id);
    try {
      const getmessage = await this.inboxService.getMessage(messageId);
      response.status(200).json({getmessage});
    } catch (error) {
      console.log(error);
      response.status(400).json({
        err: 'A problems occurred when getting the message',
      });
    }
  }
  
  public async postInboxMessage(request: Request, response: Response): Promise<any> {
    const placeId = Number.parseInt(request.body.place_id);
    const subject = request.body.subject;
    const uncleanBody = request.body.body;
    const cleanBody = await this.inboxService.sanitize(uncleanBody);
    if (subject === '') {
      response.status(400).json({
        error: 'A subject is required',
      });
      return;
    }
    if (cleanBody === '') {
      response.status(400).json({
        error: 'A message is required',
      });
      return;
    }
    const { apitoken } = request.headers;
    const session = this.memberService.decodeMemberToken(<string> apitoken);
    if(!session) {
      response.status(400).json({
        err: 'Invalid or missing token.',
      });
      return;
    }
    const { id } = session;
    try{
      const data = await this
        .inboxService
        .postInboxMessage(id, placeId, subject, cleanBody);
      response.status(200).json({data});
    } catch (error) {
      console.log(error);
      response.status(400).json({
        err: 'An error occurred when trying to post message',
      });
    }
  }
  
  public async postInboxReply(request: Request, response: Response): Promise<void> {
    const { apitoken } = request.headers;
    const session = this.memberService.decodeMemberToken(<string> apitoken);
    if(!session) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
      return;
    }
    const { id } = session;
    const placeId = Number.parseInt(request.body.place_id);
    const subject = request.body.subject;
    const uncleanBody = request.body.body;
    const cleanBody = await this.inboxService.sanitize(uncleanBody);
    const parentId = request.body.parent_id;
    try {
      const  data = await this
        .inboxService
        .postInboxReply(id, placeId, subject, cleanBody, parentId);
      response.status(200).json({data});
    } catch (error){
      console.log(error);
      response.status(400).json({
        error: 'An error occurred when trying to post reply',
      });
    }
  }
  
  public async deleteInboxMessage(request: Request, response: Response): Promise<void> {
    const placeId = Number.parseInt(request.body.place_id);
    const messageId = Number.parseInt(request.body.message_id);
    const type = request.body.type;
    const { apitoken } = request.headers;
    const session = this.memberService.decodeMemberToken(<string> apitoken);
    if(!session) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
      return;
    }
    const { id } = session;
    const admin = await this.adminCheck(placeId, id, type);
    if (admin) {
      try {
        await this.inboxService.deleteInboxMessage(messageId);
        response.status(200).json({success: 'deleted'});
      } catch (error) {
        console.log(error);
      }
    } else {
      response.status(403).json({error:'Access Denied'});
    }
  }
  
  public async changeInboxIntro(request: Request, response: Response): Promise<void> {
    const type = request.body.type;
    const { apitoken } = request.headers;
    const session = this.memberService.decodeMemberToken(<string> apitoken);
    if(!session) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
      return;
    }
    const { id } = session;
    const placeId = Number.parseInt(request.body.place_id);
    const uncleanIntro = request.body.intro;
    const cleanIntro = await this.inboxService.sanitize(uncleanIntro);
    const admin = await this.adminCheck(placeId, id, type);
    if (admin) {
      try {
        await this.inboxService.changeInboxIntro(placeId, cleanIntro);
        response.status(200).json({
          success: 'intro updated',
        });
      } catch (error) {
        console.log(error);
        response.status(400).json({error: 'Error on Updating'});
      }
    } else {
      response.status(403).json({error: 'Access Denied'});
    }
  }
}
const memberService = Container.get(MemberService);
const inboxService = Container.get(InboxService);
const colonyServices = Container.get(ColonyService);
const hoodService = Container.get(HoodService);
const blockService = Container.get(BlockService);
export const inboxController = new InboxController(
  memberService,
  inboxService,
  colonyServices,
  hoodService,
  blockService);
