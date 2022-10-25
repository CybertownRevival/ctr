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
import { SessionInfo } from 'session-info.interface';

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
      const user = await db.member
        .where({ password_reset_token: resetToken })
        .whereRaw('password_reset_expire > NOW()')
        .limit(1)
        .first();
      if (!user) {
        throw new Error('Invalid or expired reset token. Please request a new password reset.');
      }
      const hashedPassword = await member.encryptPassword(newPassword);
      await db.member
        .where({ id: user.id })
        .update({ password: hashedPassword });
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
      const [user] = await db.member
        .where({
          email,
          status: 1,
        });
      if (user) {
        const resetToken = crypto.randomBytes(16).toString('hex');
        const resetExpiration = new Date(Date.now()
          + MemberController.PASSWORD_RESET_EXPIRATION_DURATION * 60000);
        await db.member
          .where({ id: user.id })
          .update({
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
    const { apitoken } = request.headers;
    let sessionInfo = member.decryptToken(<string> apitoken);
    if (!sessionInfo) {
      response.status(400).json({
        error: 'Invalid or missing token.',
      });
    } else {
      // recheck admin access to keep token up-to-date
      const [adminCheck] = await db.member.where({id: sessionInfo.id}).select(['admin']);
      sessionInfo.admin = adminCheck.admin;
      const newToken = member.createToken(
        sessionInfo.id,
        sessionInfo.username,
        sessionInfo.avatar,
        adminCheck.admin,
      );

      response.status(200).json({
        message: 'success',
        token: newToken,
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
      console.error(error);
      response.status(400).json({ error: error.message });
    }
  }

  /** Controller method for updating a user's avatar */
  public async updateAvatar(request: Request, response: Response): Promise<void> {
    const session = this.decryptSession(request, response);
    if (!session) return;
    const { id, username, admin } = session;
    const { avatarId } = request.body;
    if (!avatarId) {
      response.status(400).json({
        error: 'Please pass an avatar id.',
      });
      return;
    }
    try {
      const [avatar] = await db.avatar.where({
        id: avatarId,
        status: 1,
        private: false,
      });
      if (avatar) {
        await db.member
          .where({ id })
          .update({ avatar_id: avatarId });
        const token = member.createToken(id, username, avatar, admin);
        response.status(200).json({
          message: 'Success',
          token,
          username,
        });
      }
    } catch (error) {
      console.error(error);
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
    const [user] = await db.member.where({ id: session.id });
    if (!user) {
      response.status(400).json({
        error: 'A problem occurred while fetching your account.',
      });
      return;
    }
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword ) {
      response.status(400).json({
        error: 'Incorrect current password.',
      });
      return;
    }
    const hashedPassword = await member.encryptPassword(newPassword);
    try {
      await db.member
        .where({ id: session.id })
        .update({ password: hashedPassword });
      response.status(200).json({ message: 'success' });
    } catch (error) {
      console.error(error);
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
    const [user] = await db.member.where({ email });
    if (user) {
      throw new Error('An account with this email already exists.');
    }
  }

  /**
   * Checks to see if the provided username already exists in the db.
   * @param username username to be checked
   * @returns Promise which will resolve if no duplicate username exists, and reject if one does
   */
  private async checkDuplicateUsername(username: string): Promise<void> {
    const [user] = await db.member.where({ username });
    if (user) {
      throw new Error('An account with this username already exists.');
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
      const [user] = await db.member.where({ username });
      if (!user) throw new Error('Account not found.');
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) throw new Error('Incorrect login details.');
      const { avatar_id, id } =  user;
      const [avatar] = await db.avatar.where({ id: avatar_id });
      const token = member.createToken(id, user.username, avatar, user.admin);
      return token;
    } catch(error) {
      console.error(error);
      throw new Error(error.message);
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
      const [memberId] = await db.member
        .insert({
          email,
          password: hashedPassword,
          username,
        }, ['id']);
      const [avatar] = await db.avatar.where({ id: 1 });
      const token = member.createToken(memberId, username, avatar, false);
      return token;
    } catch (error) {
      console.error(error);
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
