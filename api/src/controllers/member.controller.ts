import * as _ from 'lodash';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Request, Response } from 'express';
import { Container, Service } from 'typedi';
import validator from 'validator';

import {db, knex} from '../db';
import {
  sendPasswordResetEmail,
  sendPasswordResetUnknownEmail,
} from '../libs';
import { MemberService } from '../services/member/member.service';
import { SessionInfo } from 'session-info.interface';

@Service()
class MemberController {
  /** Duration in minutes until a password reset attempt expires */
  public static readonly PASSWORD_RESET_EXPIRATION_DURATION = 15;
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
  constructor(private memberService: MemberService) {}

  /** Controller method for creating a new user session. */
  public async login(request: Request, response: Response): Promise<void> {
    const { username, password } = request.body;
    try {
      this.validateLoginInput(username, password);
      const token = await this.createSession(username, password);
      response.status(200).json({
        message: 'Login Successful',
        token,
        username,
      });
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
      const member = await db.member
        .where({ password_reset_token: resetToken })
        .whereRaw('password_reset_expire > NOW()')
        .limit(1)
        .first();
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
        const resetToken = crypto.randomBytes(16).toString('hex');
        const resetExpiration = new Date(Date.now()
          + MemberController.PASSWORD_RESET_EXPIRATION_DURATION * 60000);
        await this.memberService.update(member.id, {
          password_reset_expire: resetExpiration,
          password_reset_token: resetToken,
        });
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
      const session = this.memberService.decodeMemberToken(<string> apitoken);
      if (session) {
        // refresh client token with latest from database
        const token = await this.memberService.encodeMemberToken(session.id);
        response.status(200).json({
          message: 'success',
          token,
          user: session,
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
        throw new Error('An account with this email already exists.');
      }
      const memberId = await this.memberService.createMember(email, username, password);
      const token = await this.memberService.encodeMemberToken(memberId);
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
    const session = this.decryptSession(request, response);
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
      const token = await this.memberService.encodeMemberToken(id);
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
    const session = this.decryptSession(request, response);
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
    if (!validPassword ) {
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

  public async getHome(request: Request, response: Response): Promise<void> {
    const session = this.decryptSession(request, response);
    if (!session) return;

    try {
      // todo, join map_location
      // todo, fetch block name

      const [homeData] = await db.place
        .where({
          type: 'home',
          member_id: session.id,
        })
        .select(['id']);

      if(homeData.id) {
        const blockData = await knex
          .select(
            'place.id',
            'place.name',
          )
          .from('map_location')
          .leftJoin('place', 'map_location.parent_place_id', 'place.id')
          .where('map_location.place_id', homeData.id);

        response.status(200).json({
          homeData: homeData,
          blockData: blockData,
        });
      } else {
        response.status(200).json({
          homeData: null,
          blockData: null,
        });
      }


    } catch (error) {
      console.error(error);
      response.status(400).json({
        error: 'A problem occurred during fetching home data.',
      });

    }

  }

  /**
   * 
   * @param username user name
   * @param password user password
   * @returns Promise that resolves with the user's token string if successful, otherwise rejects
   */
  private async createSession(username: string, password: string): Promise<string> {
    try {
      const member = await this.memberService.find({ username });
      if (!member) throw new Error('Account not found.');
      const validPassword = await bcrypt.compare(password, member.password);
      if (!validPassword) throw new Error('Incorrect login details.');
      return await this.memberService.encodeMemberToken(member.id);
    } catch(error) {
      console.error(error);
      throw new Error(error.message);
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
  private validateSignupInput(email: string, username: string, password: string):void {
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

  /**
   * Attempts to decode the session token present in the request and automatically responds with a
   * 400 error if decryption is unsuccessful
   * @param request express request object
   * @param response express response object
   * @returns session info object if decoding was successful, `void` otherwise
   */
  private decryptSession(request: Request, response: Response): SessionInfo {
    const { apitoken } = request.headers;
    const session = this.memberService.decodeMemberToken(<string> apitoken);
    if (!session) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
    }
    return session;
  }
}
export const memberController = Container.get(MemberController);
