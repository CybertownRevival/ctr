import { Knex } from 'knex';

const COLLATE = 'utf8mb4_unicode_ci';
function applyCommon(table: Knex.CreateTableBuilder) {
  table.collate(COLLATE);
  table.increments('id').primary();
  table.timestamps(false, true);
}

export async function up(knex: Knex): Promise<void> {
  if(!await knex.schema.hasTable('wallet')) {
    await knex.schema.createTable('wallet', table => {
      console.log('Creating wallet table');
      applyCommon(table);

      table.integer('balance')
        .unsigned()
        .defaultTo(0)
        .notNullable();
    });

    if (!await knex.schema.hasColumn('member','wallet_id')){
      await knex.schema.alterTable('member', table => {
        console.log('Adding wallet_id to member table');

        table.integer('wallet_id')
          .unsigned()
          .notNullable();
      });
    }
    const members = await knex('member').select('id');
    console.log(`Creating wallets for ${members.length} existing users`);
    for (const member of members) {
      const { id } = member;
      const [walletId] = await knex('wallet').insert({});
      await knex('member')
        .where({ id })
        .update({ wallet_id: walletId });
    }

    await knex.schema.table('member', table => {
      table.unique(['wallet_id']);
      table.foreign('wallet_id')
        .references('wallet.id');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('SET foreign_key_checks = 0');
  if (await knex.schema.hasColumn('member', 'wallet_id')) {
    console.log('Removing wallet_id from member table');
    await knex.schema.alterTable('member', table => {
      table.dropForeign('wallet_id');
      table.dropColumn('wallet_id');
    });
  }
  if (await knex.schema.hasTable('wallet')) {
    console.log('Dropping wallet table');
    await knex.schema.dropTable('wallet');
  }
  await knex.raw('SET foreign_key_checks = 1');
}
