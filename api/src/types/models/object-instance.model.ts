import { Model } from './model';

/** Defines an ObjectInstance object as stored in the db */
export interface ObjectInstance extends Model {
  object_id: number;
  member_id: number;
  place_id: number;
  position: string;
  rotation: string;
}
