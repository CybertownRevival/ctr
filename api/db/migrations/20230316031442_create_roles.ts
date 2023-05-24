import { Knex } from 'knex';

const COLLATE = 'utf8mb4_unicode_ci';
function applyCommon(table: Knex.CreateTableBuilder) {
  table.collate(COLLATE);
  table.increments('id').primary();
  table.timestamps(false, true);
}

const tableName = 'role';

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable(tableName))) {
    await knex.schema.createTable(tableName, table => {
      console.log(`Creating ${tableName} table`);
      applyCommon(table);

      table.boolean('active').notNullable().defaultTo(true);

      table.string('name').notNullable();

      table.integer('required_xp').unsigned().notNullable().defaultTo(0);

      table.integer('income_xp').unsigned().notNullable().defaultTo(0);

      table.integer('income_cc').unsigned().notNullable().defaultTo(0);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable(tableName)) {
    console.log(`Dropping ${tableName} table`);
    await knex.schema.dropTable(tableName);
  }
}
