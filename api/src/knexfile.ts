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
   * Without this key, Db passes undefined to knex while test modules load. The database
   * name is deliberately fixed instead of reading DB_DATABASE, so NODE_ENV=test cannot
   * select a development or production schema.
   */
  test: {
    client: 'mysql',
    connection: {
      host: process.env.DB_HOST,
      port: Number.parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: 'ctr_test',
      charset: 'utf8mb4',
    },
    // min 0, unlike the other environments. A minimum of 2 makes the pool open
    // connections it will not be asked for, and jest then hangs at the end of a run
    // waiting on handles that nothing will close.
    pool: {
      min: 0,
      max: 5,
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
