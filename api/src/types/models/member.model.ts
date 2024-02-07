import { Model } from './model';

/** Defines a Member object as stored in the db */
export interface Member extends Model {
  /** Whether or not the member has admin priveleges */
  admin: boolean;
  /** Foreign key reference to the member's avatar record */
  avatar_id: number;
  /** Member's email address */
  email: string;
  /** Time when the member last received a daily login credit */
  last_daily_login_credit: Date;
  /** Salted password */
  password: string;
  /** Time when a password reset token requested by the user should expire */
  password_reset_expire?: Date;
  /** Token generated if the user requests to reset their password */
  password_reset_token?: string;
  /** The member's status */
  status: number;
  /** The member's username */
  username: string;
  /** Foreign key reference to the member's wallet record */
  wallet_id: number;
  /** Amount of experience points the member has accrued over the lifetime of their account */
  xp: number;
  /** The real first name */
  firstname: string;
  /** the real last name */
  lastname: string;
  /** default chat choice */
  chatdefault: number;
  /** the role they wish to display in chat */
  primary_role_id?: number;
  /** this last time they received role based credits */
  last_weekly_role_credit: Date;
  /** this is the max end date of the last ban the user has */
  end_date?: string;
  /** this is the ban status for the user */
  banned: boolean;
}
