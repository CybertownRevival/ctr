import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasColumn('member', 'primary_role_field'))) {
    console.log(`Adding role fields to member table`);
    await knex.schema.alterTable('member', table => {
      table.integer('primary_role_id');
      table.timestamp('last_weekly_role_credit').notNullable().defaultTo(knex.fn.now());
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn('member', 'primary_role_id')) {
    console.log(`Dropping role fields from member table`);
    await knex.schema.alterTable('member', table => {
      table.dropColumn('primary_role_id');
      table.dropColumn('last_weekly_role_credit');
    });
  }
}
