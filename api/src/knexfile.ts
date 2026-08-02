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
   * Without this key `config[process.env.NODE_ENV]` was undefined, and because Db's
   * constructor calls `knex(...)` at import time, EIGHT of the twelve suites died before
   * running a single assertion:
   *
   *   TypeError: Cannot read properties of undefined (reading 'client')
   *     at new Db (src/db/db.class.ts:13:22)
   *
   * They were reported as failures rather than skips, so the suite looked broken rather
   * than absent, and the four that did run made it look like the tests were merely
   * flaky. Nothing about the mocked repositories needed a database -- they only needed
   * `knex()` not to throw while the module graph loaded.
   *
   * The connection details still come from the environment, so this same key is what a
   * real database-backed test points at. Set DB_DATABASE to a throwaway schema when
   * doing that; unit tests never open a socket, because knex connects lazily.
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
