import * as _ from 'lodash';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Service } from 'typedi';

import {
  AvatarRepository,
  MemberRepository,
  TransactionRepository,
  WalletRepository,
  PlaceRepository,
  MapLocationRepository,
} from '../../repositories';
import { Member, Place } from '../../types/models';
import { MemberInfoView } from '../../types/views';
import { SessionInfo } from 'session-info.interface';

/** Service for dealing with members */
@Service()
export class MemberService {
  /** Amount of cityccash a member receives each day they log in */
  public static readonly DAILY_CC_AMOUNT = 50;
  /** Amount of experience points a member received each day they log in */
  public static readonly DAILY_XP_AMOUNT = 5;
  /** Duration in minutes until a password reset attempt expires */
  public static readonly PASSWORD_RESET_EXPIRATION_DURATION = 15;
  /** Number of times to salt member passwords */
  private static readonly SALT_ROUNDS = 10;

  constructor(
    private avatarRepository: AvatarRepository,
    private memberRepository: MemberRepository,
    private transactionRepository: TransactionRepository,
    private walletRepository: WalletRepository,
    private placeRepository: PlaceRepository,
    private mapLocationRespository: MapLocationRepository,
  ) {}

  /**
   * Creates a new member with the given email, username, and password. If successful, distributes
   * daily login bonuses, and returns an encoded member token.
   * @param email member email address
   * @param username member usename, used during login
   * @param password  raw member password
   * @returns promise resolving in the session token for the newly created member
   */
  public async createMemberAndLogin(email: string, username: string, password: string):
  Promise<string> {
    const hashedPassword = await this.encryptPassword(password);
    const memberId = await this.memberRepository.create({
      email,
      username,
      password: hashedPassword,
    });
    await this.maybeGiveDailyCredits(memberId);
    return this.getMemberToken(memberId);
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
   * Builds a member info view.
   * @param memberId id of member to retrieve info for
   * @returns promise resolving in a member info view object, or rejecting on error
   */
  public async getMemberInfo(memberId: number): Promise<MemberInfoView> {
    const member = await this.find({ id: memberId });
    const wallet = await this.walletRepository.findById(member.wallet_id);
    return {
      email: member.email,
      immigrationDate: member.created_at,
      username: member.username,
      walletBalance: wallet.balance,
      xp: member.xp,
    };
  }

  /**
   * Returns a JSON web token for the member with the given memberId.
   * @param memberId id of member to generate a token for
   * @returns promise resolving in encoded token, or rejecting on error
   */
  public async getMemberToken(memberId: number): Promise<string> {
    const member = await this.memberRepository.findById(memberId);
    return this.encodeMemberToken(member);
  }

  /**
   * Determines if the member with the given id has received their daily login bonus since the
   * beginning (00:00:00) of the current day.
   * @param member member object to be checked
   * @returns `true` if the member has received their daily login bonus today, `false` otherwise
   */
  public hasReceivedLoginCreditToday(member: Member): boolean {
    const today = new Date().setHours(0, 0, 0, 0); 
    return member.last_daily_login_credit.getTime() >= today;
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
   * Validates the given username and password and logs a user in.
   * @param username username of member to be logged in
   * @param password password of member to be logged in
   * @returns 
   */
  public async login(username: string, password: string): Promise<string> {
    const member = await this.memberRepository.find({ username });
    if (!member) throw new Error('Account not found.');
    const validPassword = await bcrypt.compare(password, member.password);
    if (!validPassword) throw new Error('Incorrect login details.');
    this.maybeGiveDailyCredits(member.id);
    return this.encodeMemberToken(member);
  }

  /**
   * Distributes daily credits (citycash, xp) to the member with the given id if they haven't
   * already received any today.
   * @param memberId id of member to receive daily credits
   * @returns promise resolving when complete, rejecting on error
   */
  public async maybeGiveDailyCredits(memberId: number): Promise<void> {
    const member = await this.memberRepository.findById(memberId);
    if (!this.hasReceivedLoginCreditToday(member)) {
      await this.transactionRepository.createDailyCreditTransaction(
        member.wallet_id,
        MemberService.DAILY_CC_AMOUNT,
      );
      await this.memberRepository.update(
        memberId,
        {
          last_daily_login_credit: new Date(),
          xp: member.xp + MemberService.DAILY_XP_AMOUNT,
        },
      );
    }
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
   * Encodes a JSON web token for the member with the given memberId.
   * @param member member object to encode a token for
   * @returns promise resolving in encoded token, or rejecting on error
   */
  private async encodeMemberToken(member: Member): Promise<string> {
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
   * Hashes the given password.
   * @param password cleartext password to be encrypted
   * @returns promise resolving in hashed password or rejecting on error
   */
  private encryptPassword(password: string): Promise<string> {
    return bcrypt.hash(password, MemberService.SALT_ROUNDS);
  }

  /**
   * Updates a members first and last name
   * @param memberId id of the member
   * @param firstName string of the first name
   * @param lastName string of the last name
   */
  public async updateName(memberId: number, firstName: string, lastName: string): Promise<void> {
    await this.memberRepository.update(memberId, {
      firstname: firstName,
      lastname: lastName,
    });
  }

  /**
   * Get a place object for a member's home
   * @param memberId id of the member
   */
  public async getHome(memberId: number): Promise<Place> {
    const place = await this.placeRepository.findHomeByMemberId(memberId);
    return place;
  }

  public async getHomeBlock(homePlaceId: number): Promise<Place> {
    // todo get home's parent_place id
    const parentPlaceId = await this.mapLocationRespository.findParentPlaceId(homePlaceId);
    const place = await this.placeRepository.findById(parentPlaceId);
    return place;

  }
}
