import { Knex } from 'knex';

const COLLATE = 'utf8mb4_unicode_ci';
function applyCommon(table: Knex.CreateTableBuilder) {
  table.collate(COLLATE);
  table.increments('id').primary();
  table.timestamps(false, true);
}

export async function up(knex: Knex): Promise<void> {
  if (!await knex.schema.hasTable('messageboard')) {
    await knex.schema.createTable('messageboard', table => {
      console.log('Creating messageboard table again');
      applyCommon(table);
            
      table.integer('place_id', 10)
        .unsigned()
        .notNullable();
      table.foreign('place_id')
        .references('place.id');
            
      table.integer('member_id')
        .unsigned()
        .notNullable();
      table.foreign('member_id')
        .references('member.id');
            
      table.text('subject')
        .notNullable();
            
      table.text('message')
        .notNullable();
            
      table.integer('parent_id', 11)
        .defaultTo(0)
        .unsigned();
            
      table.tinyint('reply', 1)
        .defaultTo(0)
        .notNullable();
            
      table.tinyint('status',1)
        .defaultTo(1)
        .notNullable();
    });
  }
    
  if (!await knex.schema.hasColumn('place','messageboard_intro')) {
    console.log('Adding column messageboard_intro to table place');
    await knex.schema.alterTable('place', table => {
      table.string('messageboard_intro');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable('messageboard')) {
    console.log('Dropping messageboard table');
    await knex.schema.dropTable('messageboard');
  }
    
  if (await knex.schema.hasColumn('place','messageboard_intro')) {
    console.log('Removing column messageboard_intro from table place');
    await knex.schema.alterTable('place', table => {
      table.dropColumn('messageboard_intro');
    });
  }
}
