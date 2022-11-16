export interface BlockData {
  loaded: boolean,
  block?: {
    name: string,
    assets_dir: string,
    id: string,
    world_filename: string,
    slug: string
  },
  hood?: {
    name: string,
    assets_dir: string,
    id: string,
    world_filename: string,
    slug: string
  },
  colony?: {
    name: string,
    assets_dir: string,
    id: string,
    world_filename: string,
    slug: string
  },
  locations?: [],
}
