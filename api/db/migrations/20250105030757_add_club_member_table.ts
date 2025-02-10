import { Knex } from 'knex';

const COLLATE = 'utf8mb4_unicode_ci';
function applyCommon(table: Knex.CreateTableBuilder) {
  table.collate(COLLATE);
  table.increments('id').primary();
  table.timestamps(false, true);
}

const tableName = 'club_member';

export async function up(knex: Knex): Promise<void> {
  if (!await knex.schema.hasTable(tableName)) {
    await knex.schema.createTable(tableName, table => {
      console.log(`Creating ${tableName} table`);
      applyCommon(table);

      table.integer('club_id')
        .unsigned()
        .notNullable();
      table.foreign('club_id')
        .references('place.id');

      table.integer('member_id')
        .unsigned()
        .notNullable();
      table.foreign('member_id')
        .references('member.id');

      table.enum('status', ['member', 'pending', 'banned'])
        .notNullable()
        .defaultTo('pending');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  
  if (await knex.schema.hasTable(tableName)) {
    console.log(`Dropping ${tableName} table`);
    await knex.schema.dropTable(tableName);
  }
}
