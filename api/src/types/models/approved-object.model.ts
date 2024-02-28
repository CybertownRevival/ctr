import { Model } from './model';

/** Defines an ObjectInstance object as stored in the db */
export interface ApprovedObject extends Model {
  id: number;
  object_id: number;
  place_id: number;
  member_id: number;
  object_name: string;
  position: string;
  rotation: string;
  status: number;
  private: boolean;
}
