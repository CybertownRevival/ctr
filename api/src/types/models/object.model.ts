import { Model } from './model';

/** Defines an ObjectInstance object as stored in the db */
export interface Object extends Model {
  id: number;
  filename: string;
  image: string;
  member_id: number;
  name: string;
  quantity: number;
  price: number;
  status: number;
  directory: string;
}
