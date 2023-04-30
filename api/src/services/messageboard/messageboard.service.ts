import { Service } from 'typedi';

import {
  MessageboardRepository,
} from '../../repositories';
import {MessageBoard} from 'models';
import {response} from "express";

/** Service for dealing with messages on message boards */
@Service()
export class MessageboardService {
  public static readonly MAX_QUERY_LIMIT = 1000;
  public static readonly VALID_ORDERS = ['id','date'];
  public static readonly VALID_ORDER_DIRECTIONS = ['asc', 'desc'];
  
  constructor(
   private messageboardRepository: MessageboardRepository,
  ) {}
  
  public async changeMessageboardIntro(
    memberId,
    placeId,
    Intro,
  ): Promise<any> {
    console.log('Service' + placeId);
    return await this.messageboardRepository.changeMessageboardIntro(memberId, placeId, Intro);
  }
  public async deleteMessageboardMessage(
    placeId,
    memberId,
    messageId,
  ): Promise<any> {
    return await this
      .messageboardRepository
      .deleteMessageboardMessage(placeId, memberId, messageId);
  }
  
  public async getAdminInfo(
   placeId,
   memberId,
  ): Promise<any> {
    return await this.messageboardRepository.getAdminInfo(placeId, memberId);
  }
  public async getInfo(
    placeId: number,
  ): Promise<any> {
    return await this.messageboardRepository.getInfo(placeId);
  }
  
  public async getMessageboardMessages(
    placeId: number,
  ): Promise<any> {
    return await this.messageboardRepository.getMessageboardMessages(placeId);
  }
  
  public async postMessageboardMessage(
    memberId: number,
    placeId: number,
    subject: string,
    message: string,
  ): Promise<any> {
    return await this
      .messageboardRepository
      .postMessageboardMessage(memberId, placeId, subject, message);
  }
  
  public async postMessageboardReply(
    memberId: number,
    placeId: number,
    subject: string,
    message: string,
    parentId: number,
  ): Promise<any>{
    return await this
      .messageboardRepository
      .postMessageboardReply(memberId, placeId, subject, message, parentId);
  }
  
  public async getMessage(
    messageId: number,
  ): Promise<void>{
    return await this
      .messageboardRepository
      .getMessage(messageId);
    console.log('Service');
  }
}
