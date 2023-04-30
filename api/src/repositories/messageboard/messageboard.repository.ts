import { Service } from 'typedi';

import { Db } from '../../db';
import {knex} from '../../db';
import {Member, MessageBoard, Place} from 'models';
import {response} from 'express';

@Service()
export class MessageboardRepository {
  
  public async changeMessageboardIntro(
    memberId: number,
    placeId: number,
    Intro: string,
  ): Promise<any> {
    const admininfo = await knex
      .select(
        'admin',
      )
      .from<Member, Member[]>('member')
      .where('id', memberId);
    const placeinfo = await knex
      .select('member_id')
      .from<Place, Place[]>('place')
      .where('id', placeId);
    if (admininfo[0].admin || placeinfo[0].member_id === memberId) {
      console.log(Intro);
      return knex('place')
        .where('id', placeId)
        .update({messageboard_intro: Intro});
    } else {
      throw new Error('not authorized');
    }
  }
  constructor(private db: Db) {}

  public async deleteMessageboardMessage(
    placeId: number,
    memberId: number,
    messageId: number,
  ): Promise<any> {
    const admininfo = await knex
      .select(
        'admin',
      )
      .from<Member, Member[]>('member')
      .where('id', memberId);
    const placeinfo = await knex
      .select('member_id')
      .from<Place, Place[]>('place')
      .where('id', placeId);
    if (admininfo[0].admin || placeinfo[0].member_id === memberId) {
      return knex('messageboard')
        .where('id', messageId)
        .update({status: 0});
    } else {
      throw new Error('not authorized');
      return;
    }
  }
  
  public async getAdminInfo(
    placeId: number,
    memberId: number,
  ): Promise<any> {
    const admininfo = await knex
      .select(
        'admin',
      )
      .from<Member, Member[]>('member')
      .where('id', memberId);
    const placeinfo = await knex
      .select('member_id')
      .from<Place, Place[]>('place')
      .where('id', placeId);
    if (admininfo[0].admin || placeinfo[0].member_id === memberId) {
      const admin = 1;
      return admin;
    } else {
      const admin = 0;
      return admin;
    }
  }
  public async getInfo(
    placeId: number,
  ): Promise<any> {
    return knex
      .select(
        'place.messageboard_intro as messageboard_intro',
        'place.name as name',
      )
      .from<Place, Place[]>('place')
      .where('place.id', placeId);
  }
  
  public async getMessageboardMessages(
    placeId: number,
  ): Promise<any> {
    return knex
      .select(
        'messageboard.created_at',
        'messageboard.id',
        'messageboard.reply',
        'messageboard.subject',
        'member.username',
        'messageboard.parent_id',
      )
      .from<MessageBoard, MessageBoard[]>('messageboard')
      .where('messageboard.place_id', placeId)
      .where('messageboard.status', 1)
      .innerJoin('member', 'messageboard.member_id', 'member.id')
      .orderBy('messageboard.parent_id', 'desc')
      .orderBy('messageboard.id', 'asc');
  }
  
  public async getMessage(
    messageId: number,
  ): Promise<any> {
    return knex
      .select(
        'message',
      )
      .from<MessageBoard, MessageBoard[]>('messageboard')
      .where('id', messageId);
  }
  
  public async postMessageboardMessage(
    memberId: number,
    placeId: number,
    subject: string,
    message: string,
  ): Promise<void> {
    const parentId = await knex('messageboard')
      .insert(
        {
          member_id: memberId,
          place_id: placeId,
          subject: subject,
          message: message,
        },
        ['id'],
      );
    return knex('messageboard')
      .where('id', '=', parentId)
      .update({'parent_id': parentId});
  }
  
  public async postMessageboardReply(
    memberId: number,
    placeId: number,
    subject: string,
    message: string,
    parentId: number,
  ): Promise<null> {
    return knex('messageboard')
      .insert(
        {
          member_id: memberId,
          place_id: placeId,
          subject: subject,
          message: message,
          parent_id: parentId,
          reply: 1,
        },
      );
  }
}
