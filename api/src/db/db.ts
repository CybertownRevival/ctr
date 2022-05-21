import mysql from 'mysql';

import * as Tables from './tables';

class DatabaseManager {
  public avatar: Tables.AvatarTable;
  public member: Tables.MemberTable;
  public message: Tables.MessageTable;
  public objectInstance: Tables.ObjectInstanceTable;
  public place: Tables.PlaceTable;
  private db: mysql.Pool;

  constructor() {
    this.db = this.createPool();
    this.avatar = new Tables.AvatarTable(this.db);
    this.member = new Tables.MemberTable(this.db);
    this.message = new Tables.MessageTable(this.db);
    this.objectInstance = new Tables.ObjectInstanceTable(this.db);
    this.place = new Tables.PlaceTable(this.db);
  }

  private createPool(): mysql.Pool {
    return mysql.createPool({
      host: process.env.DB_HOST,
      port: Number.parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_DATABASE,
    });
  }
}
export const db = new DatabaseManager();
