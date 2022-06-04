import mysql from  'mysql';

import { Member } from '../../types';

export class MemberTable {
  private db: mysql.Pool;

  constructor(db: mysql.Pool) {
    this.db = db;
  }

  /**
   * Fetches a user record from the user's email address.
   * @param email user email address
   * @returns Promise resolving in a Member object on success, rejects on error
   */
  public async byEmail(email: string): Promise<Member> {
    return new Promise((resolve, reject) => {
      this.db.query(
        'SELECT * FROM member WHERE email = ? AND status = 1 LIMIT 1',
        [email],
        (error, [result]) => {
          if (error) {
            console.error(error);
            reject(error);
          } else {
            resolve(<Member> result);
          }
        },
      );
    });
  }

  /**
   * Fetches a user record from the user's database ID.
   * @param id user db id
   * @returns Promise resolving in a Member object on success, rejects on error
   */
  public async byId(id: number): Promise<Member> {
    return new Promise((resolve, reject) => {
      this.db.query(
        'SELECT * FROM member WHERE id = ?',
        [id],
        (error, [result]) => {
          if (error) {
            console.error(error);
            reject(error);
          } else {
            resolve(<Member> result);
          }
        },
      );
    });
  }

  /**
   * Fetches a user record from a password reset token.
   * @param resetToken password reset token
   * @returns Promise resolving in a Member object on success, rejects on error
   */
  public async byPasswordResetToken(resetToken: string): Promise<Member> {
    return new Promise((resolve, reject) => {
      this.db.query(
        'SELECT * FROM member WHERE status = 1 AND password_reset_token = ? '
        + 'AND password_reset_expire > NOW() LIMIT 1',
        [resetToken],
        (error, [result]) => {
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
 * Fetches a user record from the user's username.
 * @param username user's username
 * @returns Promise resolving in a Member object on success, rejects on error
 */
  public async byUsername(username: string): Promise<Member> {
    return new Promise((resolve, reject) => {
      this.db.query(
        'SELECT * FROM member WHERE binary username = ?',
        [username],
        (error, [result]) => {
          if (error) {
            console.error(error);
            reject('A problem occurred trying to fetch member');
          } else {
            resolve(<Member> result);
          }
        },
      );
    });
  }

  /**
   * Fetches a count of user records that contain the given email address.
   * @param email user email address
   * @returns Promise resolving in the count of users with the provided email on success,
   * rejects on error
   */
  public async countByEmail(email: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.query(
        'SELECT COUNT(1) as total FROM member WHERE email = ?',
        [email],
        (error, [result]) => {
          if (error) {
            console.error(error);
            reject(error);
          } else {
            resolve(result.total);
          }
        },
      );
    });
  }

  /**
   * Fetches a count of user records that contain the given username.
   * @param username user's username
   * @returns Promise resolving in the count of users with the provided username on success,
   * rejects on error
   */
  public async countByUsername(username: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.query(
        'SELECT COUNT(1) as total FROM member WHERE username = ?',
        [username],
        (error, [result]) => {
          if (error) {
            console.error(error);
            reject(error);
          } else {
            resolve(result.total);
          }
        },
      );
    });
  }

  /**
   * Creates a new user record in the database with the given username, password, and email.
   * @param email user email address
   * @param username user's username
   * @param password user password
   * @returns Promise resolving in the ID of the newly created user on success,
   * rejects on error
   */
  public async create(email: string, username: string, password: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.query(
        'INSERT INTO member SET email = ?, username = ?, password = ?, avatar_id = 1',
        [email, username, password],
        (error, result: mysql.OkPacket) => {
          if (error) {
            console.error(error);
            reject(error);
          } else {
            resolve(result.insertId);
          }
        },
      );
    });
  }

  /**
   * Updates the user with the given ID with the given password reset token.
   * @param id user db id
   * @param resetToken token to be set
   * @returns Promise that resolves if the update was a success, rejects otherwise
   */
  public async setPasswordResetTokenById(id: number, resetToken: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.query(
        'UPDATE member SET password_reset_token = ?, password_reset_expire = DATE_ADD(NOW(), '
        + 'INTERVAL 15 MINUTE) WHERE id = ?',
        [resetToken, id],
        (error) => {
          if (error) {
            console.error(error);
            reject(error);
          } else {
            resolve();
          }
        },
      );
    });
  }

  /**
   * Updates the user with the given ID with the given avatar id
   * @param id user db id
   * @param avatarId avatar db id to be stored
   * @returns Promise that resolves if the update was a success, rejects otherwise
   */
  public async updateAvatarById(id: number, avatarId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.query(
        'UPDATE member SET avatar_id = ? WHERE id = ?',
        [avatarId, id],
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
   * Updates the user with the given ID with the given password.
   * @param id user db id
   * @param password user's new password to be stored
   * @returns Promise that resolves if the update was a success, rejects otherwise
   */
  public async updatePasswordById(id: number, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.query(
        'UPDATE member SET password = ? WHERE id = ?',
        [password, id],
        error => {
          if (error) {
            console.error(error);
            reject(error);
          } else {
            resolve();
          }
        },
      );
    });
  }
}
