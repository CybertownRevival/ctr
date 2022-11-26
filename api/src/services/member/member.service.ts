import * as _ from 'lodash';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import{ Db } from '../../db';
import { Member } from '../../types/models';
import { SessionInfo } from 'session-info.interface';

export class MemberService {
  /** Number of times to salt member passwords */
  private static readonly SALT_ROUNDS = 10;

  constructor(private db: Db) {}

  /**
   * Creates a new member with the given email, username, and password.
   * @param email member email address
   * @param username member usename, used during login
   * @param password  raw member password
   * @returns promise resolving in the id for the newly created member
   */
  public async createMember(email: string, username: string, password: string): Promise<number> {
    const hashedPassword = await this.encryptPassword(password);
    const [walletId] = await this.db.wallet.insert({});
    const [memberId] = await this.db.member
      .insert({
        email,
        password: hashedPassword,
        username,
        wallet_id: (<number> walletId),
      });
    return memberId;
  }

  /**
   * Decodes the given JSON web token into raw session info.
   * @param token token to be decoded
   * @returns decoded session info
   */
  public decodeMemberToken(token: string): SessionInfo {
    return (<SessionInfo> jwt.verify(token, process.env.JWT_SECRET));
  }

  /**
   * Encodes a JSON web token for the member with the given memberId.
   * @param memberId id of member to generate a token for
   * @returns promise resolving in encoded token, or rejecting on error
   */
  public async encodeMemberToken(memberId: number): Promise<string> {
    const member = await this.find({ id: memberId });
    const [avatar] = await this.db.avatar.where({ id: member.avatar_id });
    return jwt.sign(
      {
        id: member.id,
        username: member.username,
        avatar,
        admin: member.admin,
      },
      process.env.JWT_SECRET,
    );
  }

  /**
   * Finds a user with the given search parameters if one exists.
   * @param memberSearchParams object containing properties of a member for searching on
   * @returns promise resolving in the found member object, or rejecting on error
   */
  public async find(memberSearchParams: Partial<Member>): Promise<Member> {
    const [member] = await this.db.member.where(memberSearchParams);
    return member;
  }

  /**
   * Determines if the member with the given id has received their daily login bonus since the
   * beginning (00:00:00) of the current day.
   * @param memberId id of member to be checked
   * @returns promise resolving in `true` if the member has received their daily login bonus today,
   * `false` otherwise, or rejecting on error
   */
  public async hasReceviedLoginBonusToday(memberId: number): Promise<boolean> {
    const member = await this.find({ id: memberId });
    const today = new Date().setHours(0, 0, 0, 0); 
    return member.last_daily_login_bonus.getTime() >= today;
  }

  /**
   * Checks if the member with the given ID has admin status.
   * @param memberId id of member to be checked
   * @returns promise resolving in a boolean, or rejecting on error
   */
  public async isAdmin(memberId: number): Promise<boolean> {
    const member = await this.find({ id: memberId });
    return member.admin;
  }

  /**
   * Assigns the avatar with the given id, if one exists, to the member with the given id.
   * @param memberId id of member to be updated
   * @param avatarId id of avatar to be assigned to member
   * @returns promise resolving when the avatar was assigned to the member, or rejecting on
   * error
   */
  public async updateAvatar(memberId: number, avatarId: number): Promise<void> {
    const [avatar] = await this.db.avatar.where({
      id: avatarId,
      status: 1,
      private: false,
    });
    if (_.isUndefined(avatar)) throw new Error(`No avatar exists with id ${avatarId}`);
    await this.db.member
      .where({ id: memberId })
      .update({ avatar_id: avatarId });
  }

  /**
   * Sets the password for the member with the given id to a hashed version of the provided
   * password.
   * @param memberId id of member to be updated
   * @param password member's new password, in cleartext
   * @return promise resolving when password has been updated, or rejecting on error
   */
  public async updatePassword(memberId: number, password: string): Promise<void> {
    const hashedPassword = await this.encryptPassword(password);
    await this.db.member
      .where({ id: memberId })
      .update({ password: hashedPassword });
  }

  /**
   * Updates properties on the member record with the given id.
   * @param memberId id of member to be updated
   * @param props object containing key/value pairs of member properties to be updated
   * @param returning optional. defaults to false. returns the updated record if true.
   * @returns promise resolving in the updated member object, or rejecting on error
   */
  public async update(memberId: number, props: Partial<Member>, returning = false):
    Promise<Member | undefined> {
    await this.db.member
      .where({ id: memberId })
      .update(props);
    return returning
      ? this.find({ id: memberId })
      : undefined;
  }

  /**
   * Hashes the given password.
   * @param password cleartext password to be encrypted
   * @returns promise resolving in hashed password or rejecting on error
   */
  private encryptPassword(password: string): Promise<string> {
    return bcrypt.hash(password, MemberService.SALT_ROUNDS);
  }
}
