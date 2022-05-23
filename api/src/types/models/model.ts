/** Base type for representing any generic piece of data that exists in the db. */
export interface Model {
  created_at: Date;
  id: number;
  updated_at: Date;
}
