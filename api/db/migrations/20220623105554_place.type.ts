import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {

  if (await knex.schema.hasTable('place')) {
    console.log('adding place.type column');

    await knex.schema.alterTable('place', table => {
      table.string('type')
        .defaultTo('public')
        .notNullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable('place')) {
    console.log('dropping place.type column');

    await knex.schema.alterTable('place', table => {
      table.dropColumn('type');
    });
  }
}


