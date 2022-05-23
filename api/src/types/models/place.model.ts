import { Model } from './model';

/** Defines a Place object as stored in the db */
export interface Place extends Model {
  assets_dir: string;
  description?: string;
  name: string;
  slug: string;
  status: number;
  world_filename: string;
}
