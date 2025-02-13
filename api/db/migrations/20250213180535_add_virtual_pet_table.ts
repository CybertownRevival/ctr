import { Knex } from 'knex';
const tableName = 'virtual_pet';
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

      table.integer('place_id')
        .unsigned()
        .notNullable();
      table.foreign('place_id')
        .references('place.id');

      table.text('pet_name');
        
      table.text('pet_avatar_url');

      table.boolean('active')
        .defaultTo(false);

      table.integer('pet_voice_id')
        .unsigned()
        .defaultTo(0);

      table.text('pet_behaviours');
    });
  }
}


export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable(tableName)) {
    console.log(`Dropping ${tableName} table`);
    await knex.schema.dropTable(tableName);
  }
}

