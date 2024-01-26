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
  
  public async deleteMessage(id: number): Promise<any> {
    return knex('message')
      .where('id', id)
      .update({
        status: 0,
      });
  }
  
  public async getChatTotal(search: string, user: number): Promise<any> {
    return knex
      .count('message.id as count')
      .from('message')
      .innerJoin('place', 'message.place_id', 'place.id')
      .where('message.member_id', user)
      .where(this.like('place.name', search));
  }

  public async getResults(
    placeId: number,
    orderField: string,
    orderDirection: string,
    limit:number,
  ): Promise<any> {
    return knex
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
  
  public async searchUserChat(
    search: string,
    user: number,
    limit: number,
    offset: number,
  ): Promise<any> {
    return knex
      .select(
        'message.id',
        'message.body',
        'message.created_at',
        'message.status',
        'place.name',
      )
      .from('message')
      .innerJoin('place', 'message.place_id', 'place.id')
      .where('message.member_id', user)
      .where(this.like('place.name', search))
      .orderBy('message.created_at', 'desc')
      .limit(limit)
      .offset(offset);
  }
  
  /**
   * This is used to bind the user inputted value to prevent
   * SQL injection attempts while using a Knex Raw
   * @param field
   * @param value
   * @private
   */
  private like(field: string, value: string) {
    return function() {
      this.whereRaw('?? LIKE ?', [field, `%${value}%`]);
    };
  }
  
}
