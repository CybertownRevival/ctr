import * as _ from 'lodash';
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { Container } from 'typedi';
import validator from 'validator';
import * as badwords from 'badwords-list';

import { sendPasswordResetEmail, sendPasswordResetUnknownEmail } from '../libs';
import { MemberService, HomeService, PlaceService } from '../services';
import { SessionInfo } from 'session-info.interface';
import {parseInt} from 'lodash';

class MemberController {
  /** List of disallowed usernames. */
  public static readonly RESTRICTED_USERNAMES = [
    'cybertown',
    'admin',
    'moderator',
    'security',
    'officer',
    'support',
    'mina',
    'owner',
  ];

  /**
   * Constructor.
   *
   * @param memberService service for interacting with member models
   */
  constructor(
    private memberService: MemberService, 
    private homeService: HomeService,
    private placeService: PlaceService) {}

  public async getAdminLevel(request: Request, response: Response): Promise<object> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const accessLevel = await this.memberService.getAccessLevel(session.id);
    response.status(200).json({ accessLevel });
  }

  public async getDonorLevel(request: Request, response: Response): Promise<string> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    try {
      const donorLevel = await this.memberService.getDonorLevel(session.id);
      response.status(200).json(donorLevel);
    } catch (e) {
      response.status(400).json({ error: 'Something went wrong try to get donor level.' });
    }
  }

  /**
   * Controller method for providing member information
   * @route /api/member/info
   */
  public async getInfo(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    try {
      let memberInfo;

      if (typeof request.params.id !== 'undefined') {
        if (await this.memberService.canAdmin(session.id)) {
          memberInfo = await this.memberService.getMemberInfoAdmin(parseInt(request.params.id));
        } else if (await this.memberService.canStaff(session.id)) {
          memberInfo = await this.memberService.getMemberInfoAdmin(parseInt(request.params.id));
        } else if (parseInt(request.params.id) === session.id) {
          memberInfo = await this.memberService.getMemberInfo(parseInt(request.params.id));
        } else {
          memberInfo = await this.memberService.getMemberInfoPublic(parseInt(request.params.id));
        }
      } else {
        memberInfo = await this.memberService.getMemberInfo(session.id);
      }

      if (Object.keys(memberInfo).length === 0)
        throw new Error('A problem occurred while fetching account info.');

      response.status(200).json({ memberInfo });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async getMemberId(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if(!session) return;

    try {
      const userId = await this.memberService.getMemberId(request.params.username);
      response.status(200).json({ userId });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async check3d(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if(!session) return;
    try {
      const user3d = await this.memberService.check3d(request.body.username);
      response.status(200).json({ user3d });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async getActivePlaces(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if(!session) return;
    try {
      const places = await this.memberService.getActivePlaces();
      response.status(200).json( places );
    } catch (error) {
      console.error(error);
      response.status(400).json({ error });
    }
  }

  public async updateLatestActivity(request: Request, response: Response): Promise<void>{
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    try {
      await this.memberService.updateLatestActivity(session.id);
      response.status(200).json('status: success');
    } catch (error) {
      console.log(error);
    }
  }

  public async getPrimaryRoleName(request: Request, response: Response): Promise<string> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    try {
      const PrimaryRoleName = await this.memberService.getPrimaryRoleName(session.id);
      response.status(200).json({ PrimaryRoleName });
    } catch (error) {
      console.log(error);
    }
  }

  public async getRoles(request: Request, response: Response): Promise<object> {
    const id  = request.params.id;
    console.log(id);
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    if (id !== undefined) {
      const admin = await this.memberService.getAccessLevel(session.id);
      if (admin.includes('council') || admin.includes('security')) {
        try {
          const roles = await this.memberService.getRoles(parseInt(id));
          response.status(200).json({roles});
        } catch (e) {
          console.error(e);
          response.status(400).json({ error: true });
        }
      } else {
        response.status(403).json({ error: 'Access denied' });
      }
    } else {
      try {
        const roles = await this.memberService.getRoles(session.id);
        response.status(200).json({roles});
      } catch (error) {
        console.log(error);
        response.status(400).json({error});
      }
    }
  }

  public async updateInfo(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const { id } = session;
    const { firstName, lastName, chatdefault } = request.body;
    try {
      await this.memberService.updateInfo(id, firstName, lastName, chatdefault);
      response.status(200).json({ message: 'success' });
    } catch (error) {
      response.status(400).json({
        error: 'Error on Updating',
      });
    }
  }

  /** isBanned results based on member status
   * 1 = active
   * 0 = banned
   */
  public async isBanned(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    try {
      const data = await this.memberService.isBanned(session.id);
      response.status(200).json({ data });
    } catch (error) {
      console.log(error);
    }
  }

  /** Controller method for creating a new user session. */
  public async login(request: Request, response: Response): Promise<void> {
    const { username, password } = request.body;
    try {
      this.validateLoginInput(username, password);
      const token = await this.memberService.login(username, password);
      const tokenData = await this.memberService.decodeMemberToken(token);
      const homeInfo = await this.homeService.getHome(tokenData.id);

      response.status(200).json({
        message: 'Login Successful',
        token,
        username,
        hasHome: !!homeInfo,
      });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: error.message });
    }
  }

  public async joinedPlace(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    try {
      const placeId = request.body.place_id;
      const is3d = request.body.is_3d;
      const id = session.id;
      await this.memberService.joinedPlace(id, placeId, is3d);
      response.status(200).json({ status: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: error.message });
    }
  }

  /** Controller method for resetting a user's password */
  public async resetPassword(request: Request, response: Response): Promise<void> {
    const { newPassword, newPassword2, resetToken } = request.body;
    try {
      if (!resetToken || !resetToken.length) {
        throw new Error('Invalid or expired reset token.');
      }
      if (!newPassword.trim().length || newPassword !== newPassword2) {
        throw new Error('Please enter the same password twice.');
      }
      const member = await this.memberService.findByPasswordResetToken(resetToken);
      if (!member) {
        throw new Error('Invalid or expired reset token. Please request a new password reset.');
      }
      await this.memberService.updatePassword(member.id, newPassword);
      response.status(200).json({ message: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: error.message });
    }
  }

  /**
   * Controller method for sending a password reset.
   * @note currently users have to wait for the entire process to complete before receiving a
   * response
   */
  public async sendPasswordReset(request: Request, response: Response): Promise<void> {
    const { email } = request.body;
    try {
      this.validatePasswordResetInput(email);
      const member = await this.memberService.find({ email, status: 1 });
      if (member) {
        const resetToken = await this.memberService.enablePasswordReset(member.id);
        await sendPasswordResetEmail(email, resetToken);
      } else {
        await sendPasswordResetUnknownEmail(email);
      }
      response.status(200).json({ message: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: error.message });
    }
  }

  /** Controller method for getting a session */
  public async session(request: Request, response: Response): Promise<void> {
    try {
      const { apitoken } = request.headers;
      if (_.isUndefined(apitoken)) {
        throw new Error('Missing token.');
      }
      const session = this.memberService.decodeMemberToken(<string>apitoken);
      if (session) {
        // refresh client token with latest from database
        const token = await this.memberService.getMemberToken(session.id);
        const { banned, banInfo } = await this.memberService.isBanned(session.id);
        if (!banned) {
          await this.memberService.maybeGiveDailyCredits(session.id);
          const homeInfo = await this.homeService.getHome(session.id);
          const chatdefault = await this.memberService.getMemberChat(session.id);
          session.hasHome = !!homeInfo;
          session.chatdefault = chatdefault;
        }
        response.status(200).json({
          message: 'success',
          token,
          user: session,
          banned: banned,
          banInfo: banInfo,
        });
      } else {
        throw new Error('Invalid or missing token');
      }
    } catch (error) {
      console.error('Session error');
      console.error(error);
      response.status(400).json({
        error: error.message,
      });
    }
  }

  /** Controller method for registering a new user. */
  public async signup(request: Request, response: Response): Promise<void> {
    const { email, username, password } = request.body;
    try {
      this.validateSignupInput(email, username, password);
      if (await this.memberService.find({ email })) {
        throw new Error('An account with this email already exists.');
      }
      if (await this.memberService.find({ username })) {
        throw new Error('An account with this nickname already exists.');
      }
      const bannedwords = badwords.regex;
      if(username.match(bannedwords)){
        throw new Error('This language can not be used on CTR!');
      }

      const token = await this.memberService.createMemberAndLogin(email, username, password);
      response.status(200).json({
        message: 'Signup Completed',
        token,
        username,
      });
    } catch (error) {
      console.error(error);
      response.status(400).json({ error: error.message });
    }
  }

  /** Controller method for updating a user's avatar */
  public async updateAvatar(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const { id, username } = session;
    const { avatarId } = request.body;
    if (!avatarId) {
      response.status(400).json({
        error: 'Please pass an avatar id.',
      });
      return;
    }
    try {
      await this.memberService.updateAvatar(id, avatarId);
      const token = await this.memberService.getMemberToken(id);
      response.status(200).json({
        message: 'Success',
        token,
        username,
      });
    } catch (error) {
      console.error(error);
      response.status(400).json({
        error: `A problem occurred during avatar update: ${error.message}`,
      });
    }
  }

  /** Controller method for updating a user's password */
  public async updatePassword(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const { id } = session;
    const { newPassword, newPassword2, currentPassword } = request.body;
    if (newPassword !== newPassword2 || !newPassword.trim().length) {
      response.status(400).json({
        error: 'Please enter the same password twice.',
      });
      return;
    }
    const member = await this.memberService.find({ id });
    if (!member) {
      response.status(400).json({
        error: 'A problem occurred while fetching your account.',
      });
      return;
    }
    const validPassword = await bcrypt.compare(currentPassword, member.password);
    if (!validPassword) {
      response.status(400).json({
        error: 'Incorrect current password.',
      });
      return;
    }
    try {
      await this.memberService.updatePassword(id, newPassword);
      response.status(200).json({ message: 'success' });
    } catch (error) {
      console.error(error);
      response.status(400).json({
        error: 'A problem occurred during password update.',
      });
    }
  }

  public async updatePrimaryRoleId(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    const { id } = session;
    const { primaryRoleId } = request.body;
    try {
      await this.memberService.updatePrimaryRoleId(id, primaryRoleId);
      response.status(200).json({ message: 'success' });
    } catch (error) {
      response.status(400).json({
        error: 'Error on Updating',
      });
    }
  }

  public async getBackpack(request: Request, response: Response): Promise<void> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    
    const username = request.params.username;

    try {
      const objects = await this.memberService.getBackpack(username);
      response.status(200).json({ message: 'success', objects: objects });
    } catch (error) {
      response.status(400).json({
        error: 'Error on getting backpack',
      });
    }
  }

  public async getStorage(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if (!session) return;
    try {
      const storage = await this.memberService.getStorage(session.id);
      response.status(200).json({ storage });
    } catch (error) {
      console.log(error);
      response.status(400).json({ error });
    }
  }

  public async updateStorage(request: Request, response: Response): Promise<any> {
    const session = this.memberService.decryptSession(request, response);
    if(!session) return;
    try {
      const storage = await this.memberService.getStorageById(parseInt(request.body.id));
      if(!storage){
        throw new Error('Storage area not found!');
      }
      if(storage && storage.member_id !== session.id){
        throw new Error('You do not own this storage area');
      }
      let storageName = request.body.content.toString();
      storageName = storageName.replace(/[^0-9a-zA-Z \-[\]/()]/g, '');
      const bannedwords = badwords.regex;
      if(storageName.match(bannedwords)){
        throw new Error('You can not use this language on CTR!');  
      }
      if(storage && storage.member_id === session.id){
        this.placeService.updatePlaces(
          parseInt(request.body.id.toString()),
          'name',
          storageName,
        );
        response.status(200).json({status: 'success'});
      }
    } catch (error) {
      console.log(error);
      response.status(400).json({ error });
    }
  }

  /**
   * Checks that the given login information is valid.
   * @param email user email
   * @param password user password
   */
  private validateLoginInput(email: string, password: string): void {
    [email, password].forEach(item => {
      if (!item || !item.length) {
        console.log('Missing login details');
        throw new Error('All fields are required.');
      }
    });
  }

  /**
   *
   * @param email email address
   */
  private validatePasswordResetInput(email: string): void {
    if (!email || !email.length || !validator.isEmail(email)) {
      throw new Error('Provide a valid email address.');
    }
  }

  /**
   * Checks that the given user information is valid.
   * @param email email address
   * @param username username
   * @param password password
   */
  private validateSignupInput(email: string, username: string, password: string): void {
    [email, username, password].forEach(item => {
      if (!item || !item.length) {
        console.log('Missing signup details');
        throw new Error('All fields are required');
      }
    });
    if (!username.match(/^[a-zA-Z0-9_.-]*$/)) {
      console.log(`Invalid username: ${username}`);
      throw new Error('Username must be alphanumeric.');
    }
    if (MemberController.RESTRICTED_USERNAMES.includes(username.toLowerCase())) {
      console.log(`Disallowed username: ${username}`);
      throw new Error('Username is not allowed');
    }
    if (!validator.isEmail(email)) {
      console.log(`Invalid email: ${email}`);
      throw new Error('Provide a valid email address');
    }
  }
}
const memberService = Container.get(MemberService);
const homeService = Container.get(HomeService);
const placeService = Container.get(PlaceService);
export const memberController = new MemberController(memberService, homeService, placeService);
