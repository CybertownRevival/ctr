import mysql from 'mysql';

import { Message } from '../../types';

export class MessageTable {
  private db: mysql.Pool;

  constructor(db: mysql.Pool) {
    this.db = db;
  }

  /**
   * Inserts a message record.
   * @param memberId id of sending member
   * @param placeId id of place message was sent to
   * @param body body text of the message
   * @returns promise resolving when insert is complete, rejects on error
   */
  public add(memberId: number, placeId: number, body: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.query(
        'INSERT INTO message SET member_id = ?, body = ?, place_id = ?',
        [memberId, body, placeId],
        (error, result) => {
          if (error) {
            console.error(error);
            reject(error);
          } else {
            resolve(result);
          }
        },
      );
    });
  }

  /**
   * Gets a list of messages for the given place id.
   * @param placeId id of place that owns the messages
   * @param order order that messages should be returned in
   * @param orderDirection direction of ordering
   * @param limit maximum number of messages to return
   * @returns promise resolving in an array of messages resulting from the query, rejects on error
   */
  public byPlaceId(placeId: number, order: string, orderDirection: string, limit: number):
    Promise<Message[]> {
    return new Promise((resolve, reject) => {
      this.db.query(
        `SELECT m.id, m.body as msg, mem.username as "username"
        FROM message m
        INNER JOIN member mem
        ON mem.id = m.member_id
        WHERE m.place_id = ?
        AND m.status = 1
        ORDER BY ${order} ${orderDirection}
        LIMIT ${limit}`,
        [placeId],
        (error, results) => {
          if (error) {
            console.error(error);
            reject( error);
          } else {
            resolve(results);
          }
        },
      );
    });
  }
}
