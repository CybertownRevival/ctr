import {Service} from 'typedi';
import { Db } from '../../db/db.class';
import { Member, Wallet } from 'models';
import {knex} from '../../db';

/** Repository for interacting with member table data in the database. */
@Service()
export class MemberRepository {
  constructor(private db: Db) {}
  
  /**
   * Creates a new member with the given parameters.
   * @param memberParams parameters to be used for the new member
   * @returns promise resolving in the id for the newly created member
   */
  public async create(memberParams: Partial<Member>): Promise<number> {
    return await this.db.knex.transaction(async trx => {
      const [walletId] = await trx<Wallet>('wallet').insert({});
      const [memberId] = await trx<Member>('member').insert({
        ...memberParams,
        wallet_id: walletId,
      });
      return memberId;
    });
  }

  /**
   * Finds a member with the given search parameters if one exists.
   * @param memberSearchParams object containing properties of a member for searching on
   * @returns promise resolving in the found member object, or rejecting on error
   */
  public async find(memberSearchParams: Partial<Member>): Promise<Member> {
    const [member] = await this.db.member.where(memberSearchParams);
    return member;
  }

  /**
   * Finds a member with the given id if one exists.
   * @param memberId id of member to search for
   * @returns promise resolving in the found member object, or rejecting on error
   */
  public async findById(memberId: number): Promise<Member> {
    return this.find({ id: memberId });
  }
  
  public async findIdByUsername(username: string): Promise<any> {
    return this.db.knex
      .select('id')
      .from('member')
      .where('username', username);
  }

  /**
   * Finds a member with the given password reset token if one exists.
   * @param resetToken reset token to search on
   * @returns promise resolving in the found member object, or rejecting on error
   */
  public async findByPasswordResetToken(resetToken: string): Promise<Member> {
    return this.db.member
      .where({ password_reset_token: resetToken })
      .whereRaw('password_reset_expire > NOW()')
      .limit(1)
      .first();
  }
  
  public async getPrimaryRoleName(memberId: number): Promise<string> {
    return this.db.knex
      .select('role.name', 'member.primary_role_id')
      .from('member')
      .where('member.id', memberId)
      .join('role', 'member.primary_role_id', 'role.id');
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
  
  public async searchUsers(search: string, limit: number, offset: number): Promise<any> {
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
      .limit(limit)
      .offset(offset);
  }

  /**
   * Updates properties on the member record with the given id.
   * @param memberId id of member to be updated
   * @param props object containing key/value pairs of member properties to be updated
   * @param returning optional. defaults to false. returns the updated record if true.
   * @returns promise resolving in the updated member object, or rejecting on error
   */
  public async update(
    memberId: number,
    props: Partial<Member>,
    returning = false,
  ): Promise<Member | undefined> {
    await this.db.member.where({ id: memberId }).update(props);
    return returning ? this.findById(memberId) : undefined;
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
