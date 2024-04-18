import { Knex } from 'knex';

const columnName = 'texture';
export async function up(knex: Knex): Promise<void> {
  if (!await knex.schema.hasColumn('object', columnName)) {
    console.log(`Adding ${columnName} column to the object table`);
    await knex.schema.alterTable('object', table => {
      table.string(columnName)
        .after('image')
        .defaultTo(null);
    });
  }
}


export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn('object', columnName)){
    console.log(`Dropping ${columnName} column from the object table`);
    await knex.schema.alterTable('object', table => {
      table.dropColumn(columnName);
    });
  }
}

