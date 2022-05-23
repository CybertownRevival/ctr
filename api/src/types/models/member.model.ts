import { Model } from './model';

/** Defines a Member object as stored in the db */
export interface Member extends Model {
  avatar_id: number,
  email: string,
  password: string,
  password_reset_expire?: Date;
  password_reset_token?: string;
  status: number;
  username: string,
}
