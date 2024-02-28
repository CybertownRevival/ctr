import { Knex } from 'knex';

const COLLATE = 'utf8mb4_unicode_ci';
function applyCommon(table: Knex.CreateTableBuilder) {
  table.collate(COLLATE);
  table.increments('id').primary();
  table.timestamps(false, true);
}

const tableName = 'approved_objects';

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable(tableName))) {
    await knex.schema.createTable(tableName, table => {
      console.log(`Creating ${tableName} table`);
      applyCommon(table);

      table.integer('object_id')
        .notNullable()
        .unsigned();
      table.foreign('object_id')
        .references('object.id');

      table.integer('place_id')
        .notNullable()
        .unsigned();
      table.foreign('place_id')
        .references('place.id');

      table.integer('member_id')
        .unsigned()
        .defaultTo(null);
      table.foreign('member_id')
        .references('member.id');
      
      table.string('object_name')
        .notNullable();
      
      table.text('position');

      table.text('rotation');

      table.integer('status')
        .notNullable()
        .unsigned();

      table.boolean('private')
        .notNullable()
        .defaultTo(false);
    });
  }
}


export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable(tableName)) {
    console.log(`Dropping ${tableName} table`);
    await knex.schema.dropTable(tableName);
  }
}

