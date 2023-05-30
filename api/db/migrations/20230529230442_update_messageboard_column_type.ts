import { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
  if(await knex.schema.hasColumn('place', 'messageboard_intro')) {
    await knex.schema.alterTable('place', function (table) {
      table.text('messageboard_intro').alter();
    });
    console.log('Changing messageboard_intro to text');
  }
}


export async function down(knex: Knex): Promise<void> {
  if(await knex.schema.hasColumn('place', 'messageboard_intro')) {
    await knex.schema.alterTable('place', function (table) {
      table.string('messageboard_intro', 255).alter();
    });
    console.log('Changing messageboard_intro to varchar(255)');
  }
}

