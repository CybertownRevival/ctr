import mysql from 'mysql';

import { Place } from '../../types';

export class PlaceTable {
  private db: mysql.Pool;

  constructor(db: mysql.Pool) {
    this.db = db;
  }

  /**
   * Finds and returns the place record for the given slug.
   * @param slug friendly id belonging to a place
   * @returns promise resolving in the place object found for the given slug
   */
  public get(slug: string): Promise<Place> {
    return new Promise((resolve, reject) => {
      this.db.query(
        'SELECT id, slug, assets_dir, world_filename, description, name FROM place'
        + ' WHERE slug = ? AND status = 1',
        [slug],
        (error, [result]) => {
          if(error || !result) {
            reject(error || `Could not find place with slug ${slug}`);
          } else {
            resolve(result);
          }
        },
      );
    });
  }
}
