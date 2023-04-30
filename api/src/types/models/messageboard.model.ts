import { Model } from './model';

export interface MessageBoard extends Model {
  place_id: number;
  placeinfo: any;
  date: string;
  member_id: number;
  subject: string;
  message: string;
  parent_id: number;
  reply: boolean;
  status: boolean;
}
