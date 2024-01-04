import {Service} from 'typedi';

import {Db} from '../../db/db.class';
import {knex} from '../../db';

@Service()
export class AdminRepository {
  constructor(private db: Db) {}
  
  private like(field: string, value: string) {
    return function() {
      this.whereRaw('?? LIKE ?', [field, `%${value}%`]);
    };
  }
  
  public async getChatTotal(search: string, user: number): Promise<any> {
    return knex
      .count('message.id as count')
      .from('message')
      .innerJoin('place', 'message.place_id', 'place.id')
      .where('message.member_id', user)
      .where(this.like('place.name', search));
  }
  
  public async getTotal(search: string): Promise<any> {
    return knex
      .count('id as count')
      .from('member')
      .where(this.like('username', search));
  }
  
  public async searchUsers(search: string, limit: string, offset: string): Promise<any> {
    return knex
      .select(
        'id',
        'username',
        'email',
        'last_daily_login_credit',
      )
      .from('member')
      .where(this.like('username', search))
      .orWhere(this.like('email', search))
      .orderBy('id')
      .limit(Number(limit))
      .offset(Number(offset));
  }
  
  public async searchUserChat(
    search: string, 
    user: number,
    limit: string, 
    offset: string,
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
      .limit(Number(limit))
      .offset(Number(offset));
  }
  
  
}
