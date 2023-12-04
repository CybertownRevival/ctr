import {Service} from 'typedi';

import {Db} from '../../db/db.class';
import {knex} from '../../db';

@Service()
export class AdminRepository {
  constructor(private db: Db) {}
  
  public async getTotal(search: string): Promise<any> {
    return knex
      .count('id as count')
      .from('member')
      .where('username', 'like', knex.raw('?',[`%${search}%`]));
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
      .where('username', 'like', knex.raw('?',[`%${search}%`]))
      .orWhere('email', 'like', knex.raw('?',[`%${search}%`]))
      .orderBy('id')
      .limit(Number(limit))
      .offset(Number(offset));
  }
}
