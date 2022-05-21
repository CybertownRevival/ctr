import { Knex, knex } from 'knex';

import config from '../../knexfile';

(async () => {
  const { client, connection } = config[process.env.NODE_ENV];
  const { database, ...connectionConfig } = (<Knex.MySqlConnectionConfig> connection);
  console.log(`Creating database ${database}...`);
  const db = knex({ client, connection: connectionConfig });
  const [existing] = (await db.raw(`SHOW DATABASES LIKE "${database}"`));
  if (existing.length) {
    console.error(`Database ${database} already exists!`);
    process.exit(1);
  }
  await db.raw(`CREATE DATABASE IF NOT EXISTS ${database}`);
  console.log('Done');
  process.exit(0);
})();
