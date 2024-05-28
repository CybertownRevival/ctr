import { Knex } from 'knex';
const tableName = 'mall_object';
const COLLATE = 'utf8mb4_unicode_ci';
function applyCommon(table: Knex.CreateTableBuilder) {
  table.collate(COLLATE);
  table.increments('id').primary();
  table.timestamps(false, true);
}

export async function up(knex: Knex): Promise<void> {
  if(!await knex.schema.hasTable(tableName)) {
    await knex.schema.createTable(tableName, table => {
      console.log(`Creating ${tableName} table...`);
      applyCommon(table);

      table.integer('object_id')
        .unsigned()
        .notNullable();
      table.foreign('object_id')
        .references('object.id');

      table.integer('place_id')
        .unsigned();

      table.text('position');

      table.text('rotation');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable(tableName)) {
    console.log(`Dropping ${tableName} table`);
    await knex.schema.dropTable(tableName);
  }
}

