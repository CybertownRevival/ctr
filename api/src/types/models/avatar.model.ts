import { Model } from './model';

/** Defines an Avatar object as stored in the db */
export interface Avatar extends Model {
  filename: string;
  gestures: string;
  member_id: number;
  name: string;
  private: number;
  status: number;
  directory: string;
  image: string;
}
