import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  if (!await knex.schema.hasColumn('member', 'firstname')) {
    console.log('Adding firstname column to member table');
    await knex.schema.alterTable('member', table => {
      table.string('firstname');
    });
  }

  if (!await knex.schema.hasColumn('member', 'lastname')) {
    console.log('Adding lastname column to member table');
    await knex.schema.alterTable('member', table => {
      table.string('lastname');
    });
  }
}


export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn('member', 'firstname')) {
    console.log('Dropping firstname column from member table');
    await knex.schema.alterTable('member', table => {
      table.dropColumn('firstname');
    });
  }

  if (await knex.schema.hasColumn('member', 'lastname')) {
    console.log('Dropping lastname column from member table');
    await knex.schema.alterTable('member', table => {
      table.dropColumn('lastname');
    });
  }
}

