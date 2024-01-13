import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import {knex} from '../../db';
import {Message} from '../../types/models';

@Service()
export class MessageRepository {

  constructor(private db: Db) {}

  public async create(
    memberId: number,
    placeId: number,
    messageBody: string,
    status: number,
  ): Promise<number> {
    const [message] = await this.db.message
      .insert({
        body: messageBody,
        member_id: memberId,
        place_id: placeId,
        status: status,
      });

    return message;
  }

  public async getResults(
    placeId: number,
    orderField: string,
    orderDirection: string,
    limit:number,
  ): Promise<any> {
    return await knex
      .select(
        'message.id',
        'message.body as msg',
        'member.username as username',
      )
      .from<Message, Message[]>('message')
      .where('message.place_id', placeId)
      .where('message.status', '1')
      .innerJoin('member', 'message.member_id', 'member.id')
      .orderBy(orderField, orderDirection)
      .limit(limit);
        
  }

  public async deleteMessage(
    messageId: number,
    placeId: number,
  ): Promise<any> {
    return knex('message')
      .where('message.place_id', placeId)
      .where('id', messageId)
      .update({status: 0});
  }
}
