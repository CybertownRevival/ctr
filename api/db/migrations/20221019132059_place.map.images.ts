import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  if (!await knex.schema.hasColumn('place','map_background_index')) {
    await knex.schema.table('place', table => {
      table.integer('map_background_index');
      table.integer('map_icon_index');
    });
  }
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.table('place', table => {
    table.dropColumn('map_background_index');
    table.dropColumn('map_icon_index');
  });
}

