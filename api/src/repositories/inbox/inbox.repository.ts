import { Service } from 'typedi';

import { Db } from '../../db';
import {knex} from '../../db';
import {Member, Inbox, Place} from 'models';
import {response} from 'express';

@Service()
export class InboxRepository {
  
  public async changeInboxIntro(
    placeId: number,
    Intro: string,
  ): Promise<any> {
    return knex('place')
      .where('id', placeId)
      .update({inbox_intro: Intro});
  }
  constructor(private db: Db) {}

  public async deleteInboxMessage(
    messageId: number,
  ): Promise<any> {
    return knex('inbox')
      .where('id', messageId)
      .update({status: 0});
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
  
  public async getHomeId(
    memberId: number,
  ): Promise<any> {
    return knex
      .select('id')
      .from('place')
      .where('member_id', memberId);
  }
  
  public async getInfo(
    placeId: number,
  ): Promise<any> {
    return knex
      .select(
        'place.inbox_intro as inbox_intro',
        'place.name as name',
        'place.type as type',
      )
      .from<Place, Place[]>('place')
      .where('place.id', placeId);
  }
  
  public async getInboxMessages(
    placeId: number,
  ): Promise<any> {
    return knex
      .select(
        'inbox.created_at',
        'inbox.id',
        'inbox.reply',
        'inbox.subject',
        'member.username',
        'inbox.parent_id',
      )
      .from<Inbox, Inbox[]>('inbox')
      .where('inbox.place_id', placeId)
      .where('inbox.status', 1)
      .innerJoin('member', 'inbox.member_id', 'member.id')
      .orderBy('inbox.id', 'desc');
  }
  
  public async getMessage(
    messageId: number,
  ): Promise<any> {
    return knex
      .select(
        'message',
        'member_id',
      )
      .from<Inbox, Inbox[]>('inbox')
      .where('id', messageId);
  }
  
  public async postInboxMessage(
    memberId: number,
    placeId: number,
    subject: string,
    message: string,
  ): Promise<void> {
    const parentId = await knex('inbox')
      .insert(
        {
          member_id: memberId,
          place_id: placeId,
          subject: subject,
          message: message,
          parent_id: 0,
        },
      );
    return knex('inbox')
      .where('id', '=', parentId)
      .update({'parent_id': parentId});
  }
  
  public async postInboxReply(
    memberId: number,
    placeId: number,
    subject: string,
    message: string,
    parentId: number,
  ): Promise<null> {
    return knex('inbox')
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
