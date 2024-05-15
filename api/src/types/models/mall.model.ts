import { Model } from './model';

/** Defines an Mall object as stored in the db */
export interface MallObject extends Model {
  object_id: number;
  place_id: number;
  position: string;
  rotation: string;
}