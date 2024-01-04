import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasColumn('object', 'directory'))) {
    console.log(`Adding directory, price column to object table`);
    await knex.schema.alterTable('object', table => {
      table.string('directory');
      table.integer('price');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn('object', 'directory')) {
    console.log(`Dropping directory, price field from object table`);
    await knex.schema.alterTable('object', table => {
      table.dropColumn('directory');
      table.dropColumn('price');
    });
  }
}
