import { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
  if (!await knex.schema.hasColumn('member', 'place_id')) {
    console.log('Adding member online columns to the member table');
    await knex.schema.alterTable('member', table => {
      table.integer('place_id').unsigned().defaultTo(null);
      table.timestamp('last_activity');
      table.integer('is_3d').unsigned().defaultTo(0);
    });
  }
}


export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn('member', 'place_id')){
    console.log('Dropping member online columns from the member table');
    await knex.schema.alterTable('member', table => {
      table.dropColumn('place_id');
      table.dropColumn('last_activity');
      table.dropColumn('is_3d');
    });
  }
}

