import { Model } from './model';

/** Defines an ObjectInstance object as stored in the db */
export interface Object extends Model {
  id: number;
  filename: string;
  image: string;
  texture: string;
  member_id: number;
  name: string;
  quantity: number;
  limit: number;
  price: number;
  status: number;
  directory: string;
  mall_expiration: Date;
}
