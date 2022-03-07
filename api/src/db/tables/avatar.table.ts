import mysql from 'mysql';

import { Avatar } from '../../types';

export class AvatarTable {
  private db: mysql.Pool;

  constructor(db: mysql.Pool) {
    this.db = db;
  }

  /**
   * Fetches the avatar with the given id from the db.
   * @param id id of avatar to fetch
   * @returns Promise resolving in the avatar with the given id
   */
  public async byId(id: number): Promise<Avatar> {
    return new Promise((resolve, reject) => {
      this.db.query(
        'SELECT * FROM avatar WHERE id = ? AND status = 1',
        [id],
        (error, [result]) => {
          if (error) {
            console.error(error);
            reject(error);
          } else {
            // the gestures array doesn't get automatically de-serialized so we have to do it
            const { gestures } = result;
            resolve({
              ...result,
              gestures: JSON.parse(gestures),
            });
          }
        },
      );
    });
  }

  /**
   * Queries the db to see if an avatar with the givne id exists.
   * @param id id of avatar to query
   * @return Promise resolving in `true` if an avatar with the given id exists, `false` otherwise
   */
  public async doesAvatarExist(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.query(
        'SELECT id FROM avatar WHERE id = ? AND status = 1 AND private = 0',
        [id],
        (error, [result]) => {
          if (error) {
            reject(error);
          } else {
            resolve(!!result);
          }
        },
      );
    });
  }

  public async getAll(order: string, orderDirection: string, limit: number): Promise<Avatar[]> {
    return new Promise((resolve, reject) => {
      this.db.query(
        'SELECT id, name FROM avatar WHERE status = 1 AND private = 0 '
        + `ORDER BY ${order} ${orderDirection}`
        + `LIMIT ${limit}`,
        [],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        },
      );
    });
  }
}
