import type { Knex } from 'knex';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'mysql',
    connection: {
      database: 'ctr_dev',
      host: '127.0.0.1',
      password: 'pw',
      port: 3360,
      user: 'root',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      directory: './db/migrations',
      extension: 'ts',
      tableName: 'migrations',
    },
    seeds: {
      directory: './db/seed',
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
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
};
module.exports = config;
