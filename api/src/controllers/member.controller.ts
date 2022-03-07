import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Request, Response } from 'express';
import validator from 'validator';

import { db } from '../db';
import {
  member,
  sendPasswordResetEmail,
  sendPasswordResetUnknownEmail,
} from '../libs';
import { SessionInfo } from '../types';

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

  constructor() {}

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
      response.status(400).json({ error });
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
      const user = await db.member.byPasswordResetToken(resetToken);
      if (!user) {
        throw new Error('Invalid or expired reset token. Please request a new password reset.');
      }
      const hashedPassword = await member.encryptPassword(newPassword);
      await db.member.updatePasswordById(user.id, hashedPassword);
      response.status(200).json({ message: 'success' });
    } catch (error) {
      response.status(400).json({ error });
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
      const user = await db.member.byEmail(email);
      if (user) {
        const resetToken = crypto.randomBytes(16).toString('hex');
        await db.member.setPasswordResetTokenById(user.id, resetToken);
        await sendPasswordResetEmail(email, resetToken);
      } else {
        await sendPasswordResetUnknownEmail(email);
      }
      response.status(200).json({ message: 'success' });
    } catch (error) {
      response.status(400).json({ error });
    }
  }

  /** Controller method for getting a session */
  public session(request: Request, response: Response): void {
    const { apitoken } = request.headers;
    const sessionInfo = member.decryptToken(<string> apitoken);
    if (!sessionInfo) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
    } else {
      console.log(sessionInfo);
      response.status(200).json({
        message: 'success',
        token: apitoken,
        user: sessionInfo,
      });
    }
  }

  /** Controller method for registering a new user. */
  public async signup(request: Request, response: Response): Promise<void> {
    const { email, username, password } = request.body;
    try {
      this.validateSignupInput(email, username, password);
      await this.checkDuplicateEmail(email);
      await this.checkDuplicateUsername(username);
      const token = await this.createUser(email, username, password);
      response.status(200).json({
        message: 'Signup Completed',
        token,
        username,
      });
    } catch (error) {
      response.status(400).json({ error });
    }
  }

  /** Controller method for updating a user's avatar */
  public async updateAvatar(request: Request, response: Response): Promise<void> {
    const token = this.decryptSession(request, response);
    if (!token) return;
    const { id, username } = token;
    const { avatarId } = request.body;
    if (!avatarId) {
      response.status(400).json({
        error: 'Please pass an avatar id.',
      });
      return;
    }
    try {
      if (await db.avatar.doesAvatarExist(avatarId)) {
        await db.member.updateAvatarById(token.id, avatarId);
        const avatarData = await db.avatar.byId(avatarId);
        const newToken = member.createToken(id, username, avatarData);
        response.status(200).json({
          message: 'Success',
          token: newToken,
          username: username,
        });
      }
    } catch (error) {
      response.status(400).json({
        error: 'A problem occurred during avatar update.',
      });
    }
  }

  /** Controller method for updating a user's password */
  public async updatePassword(request: Request, response: Response): Promise<void> {
    const session = this.decryptSession(request, response);
    if (!session) return;
    const { newPassword, newPassword2, currentPassword } = request.body;
    if (newPassword !== newPassword2 || !newPassword.trim().length) {
      response.status(400).json({
        error: 'Please enter the same password twice.',
      });
      return;
    }
    let user;
    try {
      user = await db.member.byId(session.id);
    } catch (error) {
      response.status(400).json({
        error: 'A problem occurred while fetching your account.',
      });
      return;
    }
    try {
      await bcrypt.compare(currentPassword, user.password);
    } catch (error) {
      response.status(400).json({
        error: 'Incorrect current password.',
      });
      return;
    }

    const hashedPassword = await member.encryptPassword(newPassword);
    try {
      await db.member.updatePasswordById(session.id, hashedPassword);
      response.status(200).json({ message: 'success' });
    } catch (error) {
      response.status(400).json({
        error: 'A problem occurred during password update.',
      });
    }
  }

  /**
   * Checks to see if the provided email already exists in the db.
   * @param email email to be checked
   * @returns Promise which will resolve if no duplicate email exists, and reject if one does
   */
  private async checkDuplicateEmail(email: string): Promise<void> {
    try {
      const count = await db.member.countByEmail(email);
      if (count) {
        throw new Error('An account with this email already exists.');
      }
    } catch (error) {
      throw new Error('A problem occurred during duplicate account check.');
    }
  }

  /**
   * Checks to see if the provided username already exists in the db.
   * @param username username to be checked
   * @returns Promise which will resolve if no duplicate username exists, and reject if one does
   */
  private async checkDuplicateUsername(username: string): Promise<void> {
    try {
      const count = await db.member.countByUsername(username);
      if (count) {
        throw new Error('An account with this username already exists.');
      }
    } catch (error) {
      throw new Error('A probelm occurred during username check.');
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
      const user = await db.member.byUsername(username);
      if (!user) throw new Error('Account not found.');
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) throw new Error('Incorrect login details.');
      const { avatar_id, id } =  user;
      const avatarData = await db.avatar.byId(avatar_id);
      const token = member.createToken(id, username, avatarData);
      return token;
    } catch(error) {
      console.error(error);
      throw new Error('A problem occurred while trying to log in.');
    }
  }

  /**
   * Creates a new user in the db with the given info.
   * @param email user's email address
   * @param username user's username
   * @param password user's password
   * @returns Promise which resolves when the account has been created, and rejects if there is an
   *  issue.
   */
  private async createUser(email: string, username: string, password: string): Promise<string> {
    console.log(`Creating user: ${email}, ${username}`);
    const hashedPassword = await member.encryptPassword(password);
    try {
      const memberId = await db.member.create(email, username, hashedPassword);
      const avatarData = await db.avatar.byId(1);
      const token = member.createToken(memberId, username, avatarData);
      return token;
    } catch (error) {
      throw new Error('A problem occurred during account creation.');
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
   * Attempts to decrypt the session token present in the request and automatically responds with a
   * 400 error if decryption is unsuccessful
   * @param request express request object
   * @param response express response object
   * @returns session info object if decryption was successful, `void` otherwise
   */
  private decryptSession(request: Request, response: Response): SessionInfo {
    const { apitoken } = request.headers;
    const session = member.decryptToken(<string> apitoken);
    if (!session) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
    }
    return session;
  }
}
export const memberController = new MemberController();
