import {Service} from 'typedi';

import {Db} from '../../db/db.class';
import {knex} from '../../db';
import {RoleRepository} from '../../repositories';

@Service()
export class AdminRepository {
  constructor(
   private db: Db,
   private roleRepository: RoleRepository,
  ) {}
  
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
  
  public async addRole(member_id: number, role: number): Promise<void> {
    const supporter = this.roleRepository.roleMap.Supporter;
    const advocate = this.roleRepository.roleMap.Advocate;
    const devotee = this.roleRepository.roleMap.Devotee;
    const champion = this.roleRepository.roleMap.Champion;
    try{
      await knex('role_assignment')
        .where('member_id', member_id)
        .andWhere(function () {
          this.where('role_id', supporter)
            .orWhere('role_id', advocate)
            .orWhere('role_id', devotee)
            .orWhere('role_id', champion);
        })
        .del();
    } finally {
      await knex('role_assignment').insert({
        member_id: member_id,
        role_id: role,
      });
    }
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
  
  /**
   * This is to assist the pagination of the chat results of a user
   * @param search
   * @param user
   * @return number
   */
  public async getChatTotal(search: string, user: number): Promise<any> {
    return knex
      .count('message.id as count')
      .from('message')
      .innerJoin('place', 'message.place_id', 'place.id')
      .where('message.member_id', user)
      .where(this.like('place.name', search));
  }
  
  /**
   * This is to assist with the pagination of the user search
   * @param search
   * @return number
   */
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
      .orderBy('message.created_at', 'desc')
      .limit(Number(limit))
      .offset(Number(offset));
  }
  
  
}
