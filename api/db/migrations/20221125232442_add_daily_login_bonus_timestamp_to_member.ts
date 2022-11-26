import { Knex } from 'knex';

const columnName = 'last_daily_login_bonus';

export async function up(knex: Knex): Promise<void> {
  if (!await knex.schema.hasColumn('member', columnName)) {
    console.log(`Adding ${columnName} column to member table`);
    await knex.schema.alterTable('member', table => {
      table.timestamp(columnName)
        .notNullable()
        .defaultTo(knex.fn.now());
    });  
  }
}


export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn('member', columnName)) {
    console.log(`Dropping ${columnName} column from member table`);
    await knex.schema.alterTable('member', table => {
      table.dropColumn(columnName);
    });  
  }
}
