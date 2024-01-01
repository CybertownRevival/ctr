import { Knex } from 'knex';

const COLLATE = 'utf8mb4_unicode_ci';
function applyCommon(table: Knex.CreateTableBuilder) {
  table.collate(COLLATE);
  table.increments('id').primary();
  table.timestamps(false, true);
}

export async function up(knex: Knex): Promise<void> {
  if (!await knex.schema.hasTable('inbox')) {
    await knex.schema.createTable('inbox', table => {
      console.log('Creating inbox table again');
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
    
  if (!await knex.schema.hasColumn('place','inbox_intro')) {
    console.log('Adding column inbox_intro to table place');
    await knex.schema.alterTable('place', table => {
      table.string('inbox_intro');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable('inbox')) {
    console.log('Dropping inbox table');
    await knex.schema.dropTable('messageboard');
  }
    
  if (await knex.schema.hasColumn('place','inbox_intro')) {
    console.log('Removing column inbox_intro from table place');
    await knex.schema.alterTable('place', table => {
      table.dropColumn('inbox_intro');
    });
  }
}
