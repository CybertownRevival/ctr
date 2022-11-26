import { Model } from './model';

/** Defines a Member object as stored in the db */
export interface Member extends Model {
  admin: boolean;
  avatar_id: number;
  email: string;
  last_daily_login_bonus: Date;
  password: string;
  password_reset_expire?: Date;
  password_reset_token?: string;
  status: number;
  username: string;
  wallet_id: number;
}
