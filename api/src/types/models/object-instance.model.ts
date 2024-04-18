import { Model } from './model';

/** Defines an ObjectInstance object as stored in the db */
export interface ObjectInstance extends Model {
  id: number;
  object_id: number;
  object_name: string;
  object_price: number;
  object_buyer: string;
  member_id: number;
  place_id: number;
  position: string;
  rotation: string;
}
