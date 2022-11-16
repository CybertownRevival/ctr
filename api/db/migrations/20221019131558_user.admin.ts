import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  if (!await knex.schema.hasColumn('member','admin')) {
    await knex.schema.table('member', table => {
      table.boolean('admin')
        .defaultTo(false)
        .notNullable();
    });
  }
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('member', table => {
    table.dropColumn('admin');
  });
}

