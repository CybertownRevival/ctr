import { Model } from './model';

/** Defines a Message object as stored in the db */
export interface Message extends Model {
  body: string;
  member_id: number;
  place_id: number;
  status: number;
  username?: string;
}
