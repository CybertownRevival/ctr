/** Defines a Map Location object as stored in the db */
export interface MapLocation {
  parent_place_id: number;
  place_id: number;
  location: number;
  map_image?: string;
  available: boolean;
}
