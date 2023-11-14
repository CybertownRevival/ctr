import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  if(await knex.schema.hasColumn('transaction', 'reason')) {
    await knex.schema.alterTable('transaction', function (table) {
      table.string('reason', 50).notNullable().alter();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('transaction', function (table) {
    table.enu('reason', [
      'daily-credit',
      'home-purchase',
      'item-purchase',
      'member-to-member',
      'system-to-member',
    ]).notNullable().alter();
  });
}
