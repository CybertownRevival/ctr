import {Service} from 'typedi';

import {Db} from '../../db/db.class';
import {knex} from '../../db';
import {Member} from 'models';

@Service()
export class BanRepository {
  constructor(
   private db: Db,
  ) {
  }
  
  public async addBan(ban_member_id, end_date, type, assigner_member_id, reason) {
    return knex('ban')
      .insert({
        ban_member_id: ban_member_id,
        end_date: end_date,
        type: type,
        assigner_member_id: assigner_member_id,
        reason: reason,
      });
  }
  
  public async deleteBan(banId: number, updateReason: string): Promise<void> {
    return knex('ban')
      .where({id: banId})
      .update({
        status: 0,
        reason: updateReason,
      });
  }
  
  public async getBanHistory(ban_member_id: number): Promise<any> {
    return knex
      .select(
        'ban.id',
        'ban.created_at',
        'ban.end_date',
        'ban.type',
        'member.username',
        'ban.reason',
      )
      .from('ban')
      .innerJoin('member', 'ban.assigner_member_id', 'member.id')
      .where('ban.ban_member_id', ban_member_id)
      .where('ban.status', 1)
      .orderBy('ban.created_at', 'desc');
  }
  
  public async getBanMaxDate(member_id): Promise<any> {
    return this.db.knex
      .select('end_date', 'reason', 'type')
      .from('ban')
      .where('ban_member_id', member_id)
      .where('status', 1)
      .orderBy('end_date', 'desc')
      .limit(1)
      .first();
  }

  public async getBannedTotal(): Promise<any> {
    return this.db.knex
      .countDistinct('ban_member_id as count')
      .from('ban')
      .where({status: 1, type: 'full'})
      .andWhere('end_date', '>=', new Date());
  }

  public async getJailedTotal(): Promise<any> {
    return this.db.knex
      .countDistinct('ban_member_id as count')
      .from('ban')
      .where({status: 1, type: 'jail'})
      .andWhere('end_date', '>=', new Date());
  }

  public async getRecentBan(time: Date): Promise<any> {
    return this.db.knex
      .select('ban.*', 'member.username')
      .from('ban')
      .where('ban.status', 1)
      .andWhere('ban.type', 'full')
      .andWhere('ban.created_at', '>=', time)
      .join('member', 'member.id', 'ban.ban_member_id');
  }

  public async getRecentJail(time: Date): Promise<any> {
    return this.db.knex
      .select('ban.*', 'member.username')
      .from('ban')
      .where('ban.status', 1)
      .andWhere('ban.type', 'jail')
      .andWhere('ban.created_at', '>=', time)
      .join('member', 'member.id', 'ban.ban_member_id');
  }

  public async getUnbannedSoon(time: Date): Promise<any> {
    return this.db.knex
      .select('ban.*', 'member.username')
      .from('ban')
      .where('ban.status', 1)
      .andWhere('ban.end_date', '<=', time)
      .join('member', 'member.id', 'ban.ban_member_id');
  }

}
