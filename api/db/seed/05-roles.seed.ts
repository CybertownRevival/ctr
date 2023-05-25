import { Knex } from 'knex';

const rolesData = require('./../seed_data/roles_data.json');

export async function seed(knex: Knex): Promise<void> {
  console.log('Seeding role data');

  await knex('role').insert(rolesData);
}
