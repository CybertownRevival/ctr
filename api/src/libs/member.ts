import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import { SessionInfo } from '../types';

const saltRounds = 10;

export const member = {
  createToken: (id: number, username: string, avatar: unknown, admin: unknown): string => {
    return jwt.sign({ id, username, avatar, admin}, process.env.JWT_SECRET);
  },
  encryptPassword: (passwordText: string): Promise<string> => {
    return bcrypt.hash(passwordText, saltRounds);
  },
  decryptToken: (token: string): SessionInfo => {
    return (<SessionInfo> jwt.verify(token, process.env.JWT_SECRET));
  },
};
