import { Model } from './model';

/** Defines a Designer Home (member uploaded home design) as stored in the db */
export interface DesignerHome extends Model {
  member_id: number | null;
  place_id: number | null;
  name: string;
  price: number;
  directory: string;
  filename: string;
  image: string;
  status: number;
}

/** Defines a member's ownership of a Designer Home as stored in the db */
export interface DesignerHomeOwner extends Model {
  member_id: number;
  designer_home_id: number;
}

/** Defines a member banned from uploading Designer Homes as stored in the db */
export interface DesignerHomeBan extends Model {
  member_id: number;
  banned_by_member_id: number | null;
}

/** Defines a site wide setting as stored in the db */
export interface Setting {
  name: string;
  value: string;
  created_at: Date;
  updated_at: Date;
}
