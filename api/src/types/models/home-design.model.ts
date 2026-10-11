
/** Defines a Home Design object NOT stored in the db */
export interface HomeDesign {
  id: string,
  price: number;
  /** Set for Designer Homes, whose world files live outside the built-in home directories */
  name?: string;
  assets_dir?: string;
  world_filename?: string;
  image?: string;
}
