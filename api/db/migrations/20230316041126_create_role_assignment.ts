import { Knex } from 'knex';

const COLLATE = 'utf8mb4_unicode_ci';
function applyCommon(table: Knex.CreateTableBuilder) {
  table.collate(COLLATE);
  table.increments('id').primary();
  table.timestamps(false, true);
}

const tableName = 'role_assignment';

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable(tableName))) {
    await knex.schema.createTable(tableName, table => {
      console.log(`Creating ${tableName} table`);
      applyCommon(table);

      table.integer('member_id').unsigned().notNullable();
      table.foreign('member_id').references('member.id');

      table.integer('role_id').unsigned().notNullable();
      table.foreign('role_id').references('role.id');

      table.integer('place_id').unsigned();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable(tableName)) {
    console.log(`Dropping ${tableName} table`);
    await knex.schema.dropTable(tableName);
  }
}
