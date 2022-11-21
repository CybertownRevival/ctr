import { Db } from './db.class';

export const db = new Db();
export const knex = db.knex;
