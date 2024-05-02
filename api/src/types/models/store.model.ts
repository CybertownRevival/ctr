import { Model } from './model';

/** Defines a Store object as stored in the db */
export interface Store extends Model {
  assets_dir?: string;
  description?: string;
  name: string;
  slug?: string;
  status: number;
  world_filename?: string;
  type: string;
  map_background_icon?: number;
  map_icon_index?: number;
  member_id: number;
}
