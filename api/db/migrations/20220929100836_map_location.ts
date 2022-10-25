import { Knex } from 'knex';
const COLLATE = 'utf8mb4_unicode_ci';


export async function up(knex: Knex): Promise<void> {
  if (!await knex.schema.hasTable('map_location')) {
    await knex.schema.createTable('map_location', table => {
      console.log('Creating map_location table');

      table.collate(COLLATE);

      table.integer('parent_place_id')
        .notNullable();

      table.integer('place_id');

      table.integer('location')
        .notNullable();

      table.boolean('available')
        .defaultTo(false)
        .notNullable();

      table.primary(['parent_place_id','location']);

    });
  }
}


export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable('map_location')) {
    console.log('dropping map_location table');

    await knex.raw('SET foreign_key_checks = 0');
    await knex.schema.dropTable('map_location');
    await knex.raw('SET foreign_key_checks = 1');
  }
}

