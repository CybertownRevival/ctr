import { Knex } from 'knex';

const columnName = 'object_price';
export async function up(knex: Knex): Promise<void> {
  if (!await knex.schema.hasColumn('object_instance', columnName)) {
    console.log(`Adding ${columnName} column to the object_instance table`);
    await knex.schema.alterTable('object_instance', table => {
      table.integer(columnName)
        .unsigned()
        .defaultTo(null);
    });
  }
}


export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn('object_instance', columnName)){
    console.log(`Dropping ${columnName} column from the object_instance table`);
    await knex.schema.alterTable('object_instance', table => {
      table.dropColumn(columnName);
    });
  }
}

