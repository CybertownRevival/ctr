import { Service } from 'typedi';

import { Db } from '../../db/db.class';
import { Member, Wallet } from 'models';
import { join } from 'path';
import { result } from 'lodash';
import {stringify} from 'ts-jest';

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
}
