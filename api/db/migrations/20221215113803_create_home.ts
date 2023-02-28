import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  if (!await knex.schema.hasTable('home')) {
    await knex.schema.createTable('home', table => {
      console.log('Creating home table');

      table.integer('place_id')
        .primary()
        .notNullable();

      table.string('home_design_id');

    });
  }

  if (await knex.schema.hasColumn('place', 'home_id')) {
    console.log('Dropping home_id column from place table');
    await knex.schema.alterTable('place', table => {
      table.dropColumn('home_id');
    });
  }

}


export async function down(knex: Knex): Promise<void> {

  if (await knex.schema.hasTable('home')) {
    console.log('dropping home table');
    await knex.schema.dropTable('home');

  }

  if (!await knex.schema.hasColumn('place', 'home_id')) {
    console.log('re-adding home_id to place table');
    await knex.schema.table('place', table => {
      table.string('home_id');
    });
  }

}

