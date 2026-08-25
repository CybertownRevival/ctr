import dotenv from 'dotenv';
import type { Knex } from 'knex';

// Ensure process.env is populated with values from .env file
dotenv.config({ path: '../.env' });

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'mysql',
    connection: {
      host: process.env.DB_HOST,
      port: Number.parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_DATABASE,
      charset: 'utf8mb4',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: '../db/migrations',
      extension: 'ts',
      tableName: 'migrations',
    },
    seeds: {
      directory: './../db/seed',
    },
  },
  /**
   * Used when NODE_ENV=test, which jest sets for us.
   *
   * Without this key `config[process.env.NODE_ENV]` is undefined, and because `Db`'s
   * constructor calls `knex(...)` at import time, every suite that transitively imports a
   * repository dies while loading rather than running a single assertion. The
   * database-backed specs need the key for a second reason: it is the connection they
   * actually talk to. Point DB_DATABASE at a disposable schema before running those --
   * see `spec/integration-db.ts`, which refuses to write without an explicit opt-in.
   */
  test: {
    client: 'mysql',
    connection: {
      host: process.env.DB_HOST,
      port: Number.parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_DATABASE,
      charset: 'utf8mb4',
    },
    // min 0, unlike the other environments: a minimum of 2 opens connections nothing asks
    // for, and jest then hangs at the end of a run waiting on handles nothing will close.
    pool: {
      min: 0,
      max: 5,
    },
    migrations: {
      directory: '../db/migrations',
      extension: 'ts',
      tableName: 'migrations',
    },
    seeds: {
      directory: './../db/seed',
    },
  },
  production: {
    client: 'mysql',
    connection: {
      host: process.env.DB_HOST,
      port: Number.parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_DATABASE,
      charset: 'utf8mb4',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: '../db/migrations',
      extension: 'ts',
      tableName: 'migrations',
    },
    seeds: {
      directory: '../db/seed',
    },
  },
};
export default config;
module.exports = config;
