import { Knex } from 'knex';

const tableName = 'live_event';
const COLLATE = 'utf8mb4_unicode_ci';

function applyCommon(table: Knex.CreateTableBuilder) {
  table.collate(COLLATE);
  table.increments('id').primary();
  table.timestamps(false, true);
}

export async function up(knex: Knex): Promise<void> {
  if (!await knex.schema.hasTable(tableName)) {
    await knex.schema.createTable(tableName, table => {
      console.log(`Creating ${tableName} table...`);
      applyCommon(table);

      table.integer('place_id')
        .unsigned()
        .nullable();

      table.foreign('place_id')
        .references('place.id');

      table.boolean('enabled')
        .notNullable()
        .defaultTo(false);

      table.integer('updated_by')
        .unsigned()
        .nullable();

      table.foreign('updated_by')
        .references('member.id');
    });

    await knex(tableName).insert({
      enabled: false,
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable(tableName)) {
    console.log(`Dropping ${tableName} table`);
    await knex.schema.dropTable(tableName);
  }
}
