import { Model } from './model';

/** Defines a Role object as stored in the db */
export interface Role extends Model {
  /** Defines whether or not the role is active/available in the system */
  active: boolean;
  /** Name of the role */
  name: string;
  /** City cash income earned by memebers with the role */
  income_cc: number;
  /** Experience point income earned by members with the role */
  income_xp: number;
  /** Amount of experience required for a user to hold the role */
  required_xp: number;
}
