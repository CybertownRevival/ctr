import {knex, Knex} from 'knex';

const COLLATE = 'utf8mb4_unicode_ci';
function applyCommon(table: Knex.CreateTableBuilder) {
  table.collate(COLLATE);
  table.increments('id').primary();
  table.timestamps(false, true);
}

export async function up(knex: Knex): Promise<void> {
  if (!await knex.schema.hasTable('ban')){
    await knex.schema.createTable('ban', (table) => {
      console.log('Creating ban table');
      applyCommon(table);
      
      table.integer('status')
        .defaultTo(1);
      
      table.integer('ban_member_id')
        .notNullable();
      
      table.date('end_date')
        .notNullable();
      
      table.enu('type', ['jail', 'full'])
        .defaultTo('jail')
        .notNullable();
      
      table.integer('assigner_member_id')
        .notNullable();
      
      table.text('reason').notNullable();
    });
  }
}


export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable('ban')){
    await knex.schema.dropTable('ban');
  }
}

