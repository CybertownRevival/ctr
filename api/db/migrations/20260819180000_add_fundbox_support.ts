import { Knex } from 'knex';

const fundboxTable = 'fundbox';

export async function up(knex: Knex): Promise<void> {
  if (!await knex.schema.hasTable(fundboxTable)) {
    await knex.schema.createTable(fundboxTable, table => {
      console.log(`Creating ${fundboxTable} table...`);

      table.increments('id').primary();
      table.timestamps(false, true);

      table.integer('place_id')
        .unsigned()
        .notNullable()
        .unique();

      table.foreign('place_id')
        .references('place.id');

      table.integer('wallet_id')
        .unsigned()
        .notNullable()
        .unique();

      table.foreign('wallet_id')
        .references('wallet.id');
    });
  }

  if (!await knex.schema.hasColumn('transaction', 'authorized_by_member_id')) {
    await knex.schema.alterTable('transaction', table => {
      table.integer('authorized_by_member_id')
        .unsigned()
        .nullable();

      table.foreign('authorized_by_member_id')
        .references('member.id');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn('transaction', 'authorized_by_member_id')) {
    await knex.schema.alterTable('transaction', table => {
      table.dropForeign(['authorized_by_member_id']);
      table.dropColumn('authorized_by_member_id');
    });
  }

  if (await knex.schema.hasTable(fundboxTable)) {
    console.log(`Dropping ${fundboxTable} table`);
    await knex.schema.dropTable(fundboxTable);
  }
}
