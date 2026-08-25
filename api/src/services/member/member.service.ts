import * as _ from 'lodash';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Service } from 'typedi';

import {
  AvatarRepository,
  BanRepository,
  CreditRepository,
  hasReceivedDailyCreditToday,
  MapLocationRepository,
  MemberRepository,
  PlaceRepository,
  RoleAssignmentRepository,
  RoleRepository,
  TransactionRepository,
  WalletRepository,
  ObjectInstanceRepository,
  VoteRepository,
} from '../../repositories';
import { Member, ObjectInstance, Place } from '../../types/models';
import { MemberInfoView, MemberAdminView } from '../../types/views';
import { SessionInfo } from 'session-info.interface';
import { Request, Response } from 'express';

/** A role a member holds, as the member views list it. */
interface MemberRoleSummary {
  id: number;
  place_id: number;
  name: string;
  place: string;
}

/** Whether a member is banned, and the ban that says so. */
interface BanStatus {
  banned: boolean;
  banInfo?: { end_date?: string; reason?: string };
}

/** A place with people in it right now, decorated with its name and headcount. */
interface ActivePlaceSummary {
  place_id: number;
  name?: string;
  slug?: string;
  type?: number;
  username?: string;
  count?: number;
}

/**
 * A member who has been active recently, plus the two fields the member controller
 * resolves onto each row after this returns. Optional because the service never sets
 * them itself.
 */
interface OnlineMember {
  id: number;
  username: string;
  hasHome?: boolean;
  security?: boolean;
}

/** A storage unit belonging to a member, with the number of objects it holds. */
interface StorageUnitSummary {
  id: number;
  count?: number;
}

/**
 * A member identified from their wallet, as `findByWalletId` actually returns them.
 *
 * The query behind it selects `username` alone, so a full `Member` is not available
 * here however much the name suggests otherwise.
 */
interface WalletMemberSummary {
  username: string;
}

/**
 * The value `MemberService.getAccessLevel()` resolves to.
 *
 * At runtime this is always a `string[]` of the access tags the member holds
 * ('admin', 'security', 'leader'). The `'admin'` and `'security'` scalar members
 * exist purely for compatibility: some legacy callers still compare the whole
 * return value to a bare string (`accessLevel === 'admin'` in
 * admin.controller.ts, `accessLevel === 'security'` in member.controller.ts)
 * instead of testing membership. Those comparisons are an existing authority
 * bug: they can never be true against the array this method actually returns.
 * Repairing them changes who can reach admin functionality, so it is
 * deliberately out of scope here and is tracked as separate authority work.
 */
type LegacyAccessLevel = string[] | 'admin' | 'security';

/** Service for dealing with members */
@Service()
export class MemberService {
  /** Amount of cityccash a member receives each day they log in */
  public static readonly DAILY_CC_AMOUNT = 50;
  /** Amount of experience points a member received each day they log in */
  public static readonly DAILY_XP_AMOUNT = 5;
  /** Amount of cityccash an employed member receives each day they log in */
  public static readonly DAILY_CC_EMPLOYED_AMOUNT = 100;
  /** Amount of experience points an employed member received each day they log in */
  public static readonly DAILY_XP_EMPLOYED_AMOUNT = 10;
  /** Duration in minutes until a password reset attempt expires */
  public static readonly PASSWORD_RESET_EXPIRATION_DURATION = 15;
  /** Number of times to salt member passwords */
  private static readonly SALT_ROUNDS = 10;

  constructor(
    private avatarRepository: AvatarRepository,
    private banRepository: BanRepository,
    private memberRepository: MemberRepository,
    private creditRepository: CreditRepository,
    private transactionRepository: TransactionRepository,
    private walletRepository: WalletRepository,
    private placeRepository: PlaceRepository,
    private mapLocationRespository: MapLocationRepository,
    private roleAssignmentRepository: RoleAssignmentRepository,
    private objectInstanceRepository: ObjectInstanceRepository,
    private roleRepository: RoleRepository,
    private voteRepository: VoteRepository,
  ) { }

  public async canAdmin(memberId: number): Promise<boolean> {
    const roleAssignments = await this.roleAssignmentRepository.getByMemberId(memberId);
    // Extracted admin roles into a constant for easy management
    const ADMIN_ROLES = [
      this.roleRepository.roleMap.Admin,
      this.roleRepository.roleMap.SecurityCaptain,
      this.roleRepository.roleMap.SecurityChief,
      this.roleRepository.roleMap.SecurityLieutenant,
      this.roleRepository.roleMap.SecurityOfficer,
      this.roleRepository.roleMap.SecuritySergeant,
    ];
    return !!roleAssignments.find(assignment => ADMIN_ROLES.includes(assignment.role_id));
  }

  public async canLeader(memberId: number): Promise<boolean> {
    const roleAssignments = await this.roleAssignmentRepository.getByMemberId(memberId);
    // Extracted admin roles into a constant for easy management
    const LEADER_ROLES = [
      this.roleRepository.roleMap.Admin,
      this.roleRepository.roleMap.ColonyLeader,
      this.roleRepository.roleMap.ColonyRepresentative,
      this.roleRepository.roleMap.PlacesChief,
    ];
    return !!roleAssignments.find(assignment => LEADER_ROLES.includes(assignment.role_id));
  }

  public async canStaff(memberId: number): Promise<boolean> {
    const roleAssignments = await this.roleAssignmentRepository.getByMemberId(memberId);
    // Extracted staff roles into a constant for easy management
    const STAFF_ROLES = [
      this.roleRepository.roleMap.ColonyLeader,
      this.roleRepository.roleMap.ColonyDeputy,
      this.roleRepository.roleMap.NeighborhoodLeader,
      this.roleRepository.roleMap.NeighborhoodDeputy,
      this.roleRepository.roleMap.BlockLeader,
      this.roleRepository.roleMap.BlockDeputy,
    ];
    return !!roleAssignments.find(assignment => STAFF_ROLES.includes(assignment.role_id));
  }

  public async joinedPlace(id: number, placeId: number, is3d: number): Promise<void> {
    const now = new Date();
    await this.memberRepository.joinedPlace(id, {
      place_id: placeId,
      is_3d: is3d,
      last_activity: now,
    });
  }

  public async getAccessLevel(memberId: number): Promise<LegacyAccessLevel> {
    const security = await this.canAdmin(memberId);
    const roleAssignments = await this.roleAssignmentRepository.getByMemberId(memberId);
    const leader = await this.canLeader(memberId);
    const admin = !!roleAssignments.find(
      assignment => assignment.role_id === this.roleRepository.roleMap.Admin,
    );
    const accessLevel = [];
    if (admin) {
      accessLevel.push('admin');
    }
    if (security) {
      accessLevel.push('security');
    }
    if (leader) {
      accessLevel.push('leader');
    }
    return accessLevel;
  }

  /**
   * Creates a new member with the given email, username, and password. If successful, distributes
   * daily login bonuses, and returns an encoded member token.
   * @param email member email address
   * @param username member usename, used during login
   * @param password  raw member password
   * @returns promise resolving in the session token for the newly created member
   */

  public async createMemberAndLogin(
    email: string,
    username: string,
    password: string,
  ): Promise<string> {
    const hashedPassword = await this.encryptPassword(password);
    const memberId = await this.memberRepository.create({
      email,
      username,
      password: hashedPassword,
    });
    await this.giveDailyCreditsForLogin(memberId);
    return this.getMemberToken(memberId);
  }

  /**
   * Decodes the given JSON web token into raw session info.
   * @param token token to be decoded
   * @returns decoded session info
   */
  public decodeMemberToken(token: string): SessionInfo {
    return <SessionInfo>jwt.verify(token, process.env.JWT_SECRET);
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

  public async getDonorLevel(memberId: number): Promise<string> {
    const donorId = {
      supporter: await this.roleRepository.roleMap.Supporter,
      advocate: await this.roleRepository.roleMap.Advocate,
      devotee: await this.roleRepository.roleMap.Devotee,
      champion: await this.roleRepository.roleMap.Champion,
    };
    return await this.roleAssignmentRepository.getDonor(memberId, donorId);
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
      firstName: member.firstname,
      lastName: member.lastname,
      chatdefault: member.chatdefault,
      primary_role_id: member.primary_role_id,
    };
  }

  public async getMemberChat(memberId: number): Promise<number> {
    const member = await this.find({ id: memberId });
    return member.chatdefault;
  }

  /**
   * Builds a member info public view.
   * @param memberId id of member to retrieve info for
   * @returns promise resolving in a member info view object, or rejecting on error
   */
  public async getMemberInfoPublic(memberId: number): Promise<MemberInfoView> {
    const member = await this.find({ id: memberId });
    return {
      firstName: member.firstname,
      lastName: member.lastname,
      immigrationDate: member.created_at,
      username: member.username,
      xp: member.xp,
      chatdefault: member.chatdefault,
    };
  }

  /**
   * Builds a member info admin view.
   * @param memberId id of member to retrieve info for
   * @returns promise resolving in a member info view object, or rejecting on error
   */
  public async getMemberInfoAdmin(memberId: number): Promise<MemberAdminView> {
    const member = await this.find({ id: memberId });
    const wallet = await this.walletRepository.findById(member.wallet_id);
    return {
      email: member.email,
      immigrationDate: member.created_at,
      username: member.username,
      walletBalance: wallet.balance,
      xp: member.xp,
      firstName: member.firstname,
      lastName: member.lastname,
      chatdefault: member.chatdefault,
      last_daily_login_credit: member.last_daily_login_credit,
      last_weekly_role_credit: member.last_weekly_role_credit,
      lastAccess: member.last_activity,
    };
  }

  /**
   * Builds a member info staff view.
   * @param memberId id of member to retrieve info for
   * @returns promise resolving in a member info view object, or rejecting on error
   */
  public async getMemberInfoStaff(memberId: number): Promise<MemberAdminView> {
    const member = await this.find({ id: memberId });
    const wallet = await this.walletRepository.findById(member.wallet_id);
    return {
      immigrationDate: member.created_at,
      username: member.username,
      walletBalance: wallet.balance,
      xp: member.xp,
      firstName: member.firstname,
      lastName: member.lastname,
      chatdefault: member.chatdefault,
      last_daily_login_credit: member.last_daily_login_credit,
      last_weekly_role_credit: member.last_weekly_role_credit,
      lastAccess: member.last_activity,
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

  public async getPrimaryRoleName(memberId: number): Promise<string> {
    return this.memberRepository.getPrimaryRoleName(memberId);
  }

  public async getRoles(memberId: number): Promise<MemberRoleSummary[]> {
    const roles = await this.roleAssignmentRepository.getRoleNameAndIdByMemberId(memberId);
    return roles;
  }

  /**
   * Determines if the member with the given id has received their daily login bonus since the
   * beginning (00:00:00) of the current day.
   * @param member member object to be checked
   * @returns `true` if the member has received their daily login bonus today, `false` otherwise
   */
  public hasReceivedLoginCreditToday(member: Member): boolean {
    return hasReceivedDailyCreditToday(member.last_daily_login_credit);
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
   * Checks if the user is currently banned
   * @param memberId
   * @return banned boolean true if banned
   */
  public async isBanned(memberId: number): Promise<BanStatus> {
    let banned = false;
    const member = await this.memberRepository.findById(memberId);
    const banInfo = await this.banRepository.getBanMaxDate(memberId);
    if (typeof banInfo !== 'undefined') {
      const endDate = new Date(banInfo.end_date);
      const currentDate = new Date();
      if (member.status === 0 || endDate > currentDate) {
        banned = true;
      }
    } else {
      if (member.status === 0) banned = true;
    }
    return { banned, banInfo };
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
    if (member.status === 0) throw new Error('banned');
    await this.giveDailyCreditsForLogin(member.id);
    return this.encodeMemberToken(member);
  }

  /**
   * Distributes daily credits (citycash, xp) to the member with the given id if they haven't
   * already received any today.
   *
   * Eligibility is rechecked inside the transaction that pays, so calling this twice at
   * once credits once. Rejects if the credit could not be applied - in which case nothing
   * was applied, not even partly. Callers that are logging someone in should treat that
   * rejection as a lost bonus, not as a failed login.
   * @param memberId id of member to receive daily credits
   * @returns promise resolving when complete, rejecting on error
   */
  public async maybeGiveDailyCredits(memberId: number): Promise<void> {
    await this.creditRepository.giveDailyCredit(memberId, {
      unemployed: {
        cc: MemberService.DAILY_CC_AMOUNT,
        xp: MemberService.DAILY_XP_AMOUNT,
      },
      employed: {
        cc: MemberService.DAILY_CC_EMPLOYED_AMOUNT,
        xp: MemberService.DAILY_XP_EMPLOYED_AMOUNT,
      },
    });
  }

  /**
   * Gives daily credits as part of logging someone in, and swallows the failure if it
   * cannot.
   *
   * Awaited, so the credit has landed before the caller gets a token: unawaited, the
   * caller could read its own balance and not see it yet, and nothing kept the process
   * interested in a write that outlived the response. Caught, because refusing someone
   * their account over a missed bonus is the worse outcome of the two - and the payout is
   * all-or-nothing, so a failure here leaves no half-applied credit to clean up.
   * @param memberId id of member being logged in
   * @returns promise resolving when the credit has been applied, or has failed
   */
  public async giveDailyCreditsForLogin(memberId: number): Promise<void> {
    try {
      await this.maybeGiveDailyCredits(memberId);
    } catch (error) {
      console.error(`Failed to give daily credits to member ${memberId}:`, error);
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
    const avatar = await this.avatarRepository.getByIdAndMemberId(
      avatarId,
      memberId,
    );
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

  public async updatePrimaryRoleId(memberId: number, primaryRoleId: number): Promise<void> {
    await this.memberRepository.update(memberId, { primary_role_id: primaryRoleId });
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
   * Updates a members default chat choice firstname and lastname
   * @param memberId id of the member
   * @param firstName string of the first name
   * @param lastName string of the last name
   * @param chatdefault string of the chatdefault
   * Must retain updateName here for first time home creation firstname/lastname addition
   */
  public async updateName(memberId: number, firstName: string, lastName: string): Promise<void> {
    await this.memberRepository.update(memberId, {
      firstname: firstName,
      lastname: lastName,
    });
  }
  public async updateInfo(
    memberId: number, 
    firstName: string, 
    lastName: string, 
    email:string, 
    chatdefault: number): Promise<void> {
    await this.memberRepository.update(memberId, {
      firstname: firstName,
      lastname: lastName,
      email: email,
      chatdefault: chatdefault,
    });
  }

  /**
   * Deducts the amount for a house purchase from a member's wallet
   * @param memberId id of a member
   * @param amount amount to deduct
   */
  public async performHomePurchaseTransaction(memberId: number, amount: number): Promise<void> {
    const member = await this.memberRepository.findById(memberId);
    await this.transactionRepository.createHomePurchaseTransaction(member.wallet_id, amount);
  }

  /**
   * Refunds the amount for a house purchase to a member's wallet
   * @param memberId id of a member
   * @param amount amount to refund
   */
  public async performHomeRefundTransaction(memberId: number, amount: number): Promise<void> {
    const member = await this.memberRepository.findById(memberId);
    await this.transactionRepository.createHomeRefundTransaction(member.wallet_id, amount);
  }

  public async getMemberId(username: string): Promise<number> {
    const userId = await this.memberRepository.findIdByUsername(username);
    return userId;
  }

  public async check3d(username: string): Promise<void> {
    const user = await this.memberRepository.check3d(username);
    return user;
  }

  public async updateLatestActivity(memberId: number): Promise<void> {
    const now = new Date();
    await this.memberRepository.updateLatestActivity(memberId, {
      last_activity: now,
    });
  }

  public async getActivePlaces(): Promise<ActivePlaceSummary[]> {
    const returnPlaces = [];
    const placeIds = [];
    const activeTime = new Date(Date.now() - 5 * 60000);
    const places = await this.memberRepository.getActivePlaces(activeTime);
    for (const place of places) {
      if (placeIds.indexOf(place.place_id) === -1) {
        placeIds.push(place.place_id);
        const userPlace = await this.placeRepository.findById(place.place_id);
        const userCount = await this.memberRepository.countByPlaceId(place.place_id, activeTime);
        place.name = userPlace.name;
        place.slug = userPlace.slug;
        place.type = userPlace.type;
        if (userPlace.member_id) {
          const userOwner = await this.memberRepository.findById(userPlace.member_id);
          place.username = userOwner.username;
        }
        place.count = userCount[0].count;
        returnPlaces.push(place);
      }
    }
    return returnPlaces;
  }

  /**
   * Attempts to decode the session token present in the request and automatically responds with a
   * 400 error if decryption is unsuccessful
   * @param request Express request object
   * @param response Express response object used for sending error messages in case of token
   * decryption failure
   * @returns session info object if decoding was successful, `void` otherwise
   */
  public decryptSession(request: Request, response: Response): SessionInfo {
    const { apitoken } = request.headers;

    if (!apitoken || typeof apitoken !== 'string') {
      response.status(400).json({
        error: 'Invalid token.',
      });
      return;
    }

    try {
      const session = this.decodeMemberToken(apitoken);
      if (!session) {
        console.log('Invalid or missing Token');
        response.status(400).json({
          error: 'Invalid or missing token.',
        });
        return;
      }
      return session;
    } catch (error) {
      console.log('Malformed JWT token (expected if logged out)');
      response.status(400).json({
        error: 'Malformed JWT token.',
      });
      return;
    }
  }

  public async getOnlineUsers(): Promise<OnlineMember[]> {
    const activeTime = new Date(Date.now() - 5 * 60000);
    const users = await this.memberRepository.findOnlineUsers(activeTime);
    return users;
  }

  public async getBackpack(username: string): Promise<ObjectInstance[]> {
    let memberId = null;
    let userId = null;
    try {
      memberId = await this.memberRepository.findIdByUsername(username);
      userId = memberId[0].id;
    } catch (error) {
      userId = null;
    }
    if (userId !== null) {
      return await this.objectInstanceRepository.getMemberBackpack(userId);
    }
  }

  public async getStorage(memberId: number): Promise<StorageUnitSummary[]> {
    const units = [];
    const unit = await this.placeRepository.findStorageByUserID(memberId);
    for (const storage of unit) {
      const objects = await this.objectInstanceRepository.findByPlaceId(storage.id);
      storage.count = objects.length;
      units.push(storage);
    }
    return units;
  }

  public async getStorageById(placeId: number): Promise<Place> {
    const unit = await this.placeRepository.findById(placeId);
    return unit;
  }

  public async getMemberByWalletId(
    walletId: number,
  ): Promise<WalletMemberSummary[]> {
    const user = await this.memberRepository.findByWalletId(walletId);
    return user;
  }

  public async removeAccount(id: number): Promise<void> {
    const user = await this.memberRepository.findById(id);
    await this.roleAssignmentRepository.removeAllByUserId(id);
    await this.banRepository.removeAllByUserId(id);
    await this.transactionRepository.removeAllByWalletId(user.wallet_id);
    await this.voteRepository.removeListByUserId(id);
    await this.voteRepository.removeResponseByUserId(id);
    await this.memberRepository.removeAccount(id);
    await this.walletRepository.removeAccount((user.wallet_id));
  }
}
