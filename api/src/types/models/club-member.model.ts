import { Model } from './model';

/** Defines an Club-Member object as stored in the db */
export interface ClubMember extends Model {
  place_id: number;
  member_id: number;
  status: number;
  username: string;
}
