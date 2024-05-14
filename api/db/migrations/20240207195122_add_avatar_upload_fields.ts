import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasColumn('avatar', 'directory'))) {
    console.log(`Adding upload columns to avatar table`);
    await knex.schema.alterTable('avatar', table => {
      table.string('directory');
      table.string('image');
      table.integer('member_id');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn('avatar', 'directory')) {
    console.log(`Dropping upload columns from avatar table`);
    await knex.schema.alterTable('avatar', table => {
      table.dropColumn('directory');
      table.dropColumn('image');
      table.dropColumn('member_id');
    });
  }
}
