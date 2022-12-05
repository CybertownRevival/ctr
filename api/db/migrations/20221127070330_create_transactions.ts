import { Knex } from 'knex';

const COLLATE = 'utf8mb4_unicode_ci';
function applyCommon(table: Knex.CreateTableBuilder) {
  table.collate(COLLATE);
  table.increments('id').primary();
  table.timestamps(false, true);
}

const tableName = 'transaction';

export async function up(knex: Knex): Promise<void> {
  if (!await knex.schema.hasTable(tableName)) {
    await knex.schema.createTable(tableName, table => {
      console.log(`Creating ${tableName} table`);
      applyCommon(table);

      table.integer('amount')
        .unsigned()
        .notNullable();

      table.integer('recipient_wallet_id')
        .unsigned();
      table.foreign('recipient_wallet_id')
        .references('wallet.id');

      table.integer('sender_wallet_id')
        .unsigned();
      table.foreign('sender_wallet_id')
        .references('wallet.id');

      table.enu('reason', [
        'daily-credit', 
        'home-purchase', 
        'item-purchase', 
        'member-to-member', 
        'system-to-member',
      ]).notNullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasTable(tableName)) {
    console.log(`Dropping ${tableName} table`);
    await knex.schema.dropTable(tableName);
  }
}
