import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  if (!await knex.schema.hasColumn('object_instance', 'object_name')) {
    console.log('Adding object detail columns to the object_instance table');
    await knex.schema.alterTable('object_instance', table => {
      table.text('object_name').notNullable();
      table.integer('object_price').unsigned().defaultTo(null);
      table.text('object_buyer').defaultTo(null);
    });
  }
}


export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn('object_instance', 'object_name')){
    console.log('Dropping object detail columns from the object_instance table');
    await knex.schema.alterTable('object_instance', table => {
      table.dropColumn('object_name');
      table.dropColumn('object_price');
      table.dropColumn('object_buyer');
    });
  }
}

