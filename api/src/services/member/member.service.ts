import * as _ from 'lodash';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Service } from 'typedi';

import{ Db } from '../../db/db.class';
import { AvatarRepository, MemberRepository } from '../../repositories';
import { Member } from '../../types/models';
import { SessionInfo } from 'session-info.interface';
import { WalletService } from '../wallet/wallet.service';

/** Service for dealing with members */
@Service()
export class MemberService {
  /** Duration in minutes until a password reset attempt expires */
  public static readonly PASSWORD_RESET_EXPIRATION_DURATION = 15;
  /** Number of times to salt member passwords */
  private static readonly SALT_ROUNDS = 10;

  constructor(
    private avatarRepository: AvatarRepository,
    private memberRepository: MemberRepository,
  ) {}

  /**
   * Creates a new member with the given email, username, and password.
   * @param email member email address
   * @param username member usename, used during login
   * @param password  raw member password
   * @returns promise resolving in the id for the newly created member
   */
  public async createMember(email: string, username: string, password: string): Promise<number> {
    const hashedPassword = await this.encryptPassword(password);
    return this.memberRepository.create({ email, username, password: hashedPassword });
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
   * Sets the password reset token and expiration fields on a member record.
   * @param memberId id of member to enable password reset for
   * @returns password reset token asisgned to member
   */
  public async enablePasswordReset(memberId: number): Promise<string> {
    const resetToken = crypto.randomBytes(16).toString('hex');
    const resetExpiration = new Date(
      Date.now() + MemberService.PASSWORD_RESET_EXPIRATION_DURATION * 60000,
    );
    await this.memberRepository.update(memberId, {
      password_reset_expire: resetExpiration,
      password_reset_token: resetToken,
    });
    return resetToken;
  }

  /**
   * Encodes a JSON web token for the member with the given memberId.
   * @param memberId id of member to generate a token for
   * @returns promise resolving in encoded token, or rejecting on error
   */
  public async encodeMemberToken(memberId: number): Promise<string> {
    const member = await this.memberRepository.findById(memberId);
    const avatar = await this.avatarRepository.find({ id: member.avatar_id });
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
   * Finds a member with the given search parameters if one exists.
   * @param memberSearchParams object containing properties of a member for searching on
   * @returns promise resolving in the found member object, or rejecting on error
   */
  public async find(memberSearchParams: Partial<Member>): Promise<Member> {
    return this.memberRepository.find(memberSearchParams);
  }

  /**
   * Finds a member with the given password reset token if one exists.
   * @param resetToken reset token to search on
   * @returns promise resolving in the found member object, or rejecting on error
   */
  public async findByPasswordResetToken(resetToken: string): Promise<Member> {
    return this.memberRepository.findByPasswordResetToken(resetToken);
  }

  /**
   * Determines if the member with the given id has received their daily login bonus since the
   * beginning (00:00:00) of the current day.
   * @param memberId id of member to be checked
   * @returns promise resolving in `true` if the member has received their daily login bonus today,
   * `false` otherwise, or rejecting on error
   */
  public async hasReceviedLoginBonusToday(memberId: number): Promise<boolean> {
    const member = await this.memberRepository.find({ id: memberId });
    const today = new Date().setHours(0, 0, 0, 0); 
    return member.last_daily_login_bonus.getTime() >= today;
  }

  /**
   * Checks if the member with the given ID has admin status.
   * @param memberId id of member to be checked
   * @returns promise resolving in a boolean, or rejecting on error
   */
  public async isAdmin(memberId: number): Promise<boolean> {
    const member = await this.memberRepository.findById(memberId);
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
    const avatar = await this.avatarRepository.find({
      id: avatarId,
      status: 1,
      private: false,
    });
    if (_.isUndefined(avatar)) throw new Error(`No avatar exists with id ${avatarId}`);
    await this.memberRepository.update(memberId, { avatar_id: avatarId });
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
    await this.memberRepository.update(memberId, { password: hashedPassword });
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
