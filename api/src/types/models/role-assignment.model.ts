import { Model } from './model';

/** Defines a RoleAssignment object as stored in the db */
export interface RoleAssignment extends Model {
  /** ID of member holding the role assignment */
  member_id: number;
  /** ID of role being assigned */
  role_id: number;
  /** ID of place id role is assigned to */
  place_id: number;
}
