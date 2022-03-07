import mysql from 'mysql';

import { ObjectInstance } from '../../types';

/** Represents the shape of an object containing position/rotation data. */
interface Coordinates {
  x: number,
  y: number,
  z: number,
  angle?: number,
}

export class ObjectInstanceTable {
  private db: mysql.Pool;

  constructor(db: mysql.Pool) {
    this.db = db;
  }

  /**
   * Finds all object instance records for the place with the given id.
   * @param placeId place to query objects for
   * @returns promise resolving in an array of objects for the given place, rejects on error
   */
  public forPlace(placeId: number): Promise<ObjectInstance[]> {
    return new Promise((resolve, reject) => {
      this.db.query(
        `SELECT oi.id, oi.object_id, o.filename, o.name, oi.position, oi.rotation
        FROM object_instance AS oi
        INNER JOIN object as o 
        ON o.id = oi.object_id 
        WHERE oi.place_id = ?`,
        [placeId],
        (error, results) => {
          if (error) {
            console.error(error);
            reject(error);
          } else {
            const objects = results.map(object => {
              object.position = JSON.parse(object.position);
              object.rotation = JSON.parse(object.rotation);
            });
            resolve(objects);
          }
        },
      );
    });
  }
  /**
   * Updates the object instance with the given id with the given position and rotation.
   * @param objectInstanceId id of object to be updated
   * @param position position of object instance
   * @param rotation rotation of object instance
   * @returns promise resolving when update is complete, rejects on error
   */
  public updatePosition(objectInstanceId: number, position: Coordinates, rotation: Coordinates):
    Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.query('UPDATE object_instance SET position = ?, rotation = ? WHERE id = ?',
        [
          position,
          rotation,
          objectInstanceId,
        ],
        (error, result) => {
          if(error) {
            console.error(error);
            reject(error);
          } else {
            resolve(result);
          }
        },
      );
    });
  }
}
