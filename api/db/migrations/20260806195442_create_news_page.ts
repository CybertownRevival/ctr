import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  console.log('Creating news table...');

  await knex.schema.createTable('news', table => {
    table.increments('id').primary();

    table
      .specificType('html', 'LONGTEXT')
      .notNullable();

    table
      .integer('updated_by_member_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('member')
      .onDelete('SET NULL');

    table
      .timestamp('created_at')
      .notNullable()
      .defaultTo(knex.fn.now());

    table
      .timestamp('updated_at')
      .notNullable()
      .defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  console.log('Dropping news_page table...');

  await knex.schema.dropTableIfExists('news');
}