import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  if (!await knex.schema.hasColumn('place','map_background_index')) {
    await knex.schema.table('place', table => {
      table.integer('map_background_index');
      table.integer('map_icon_index');
      table.integer('member_id');
      table.string('home_id');
      table.setNullable('assets_dir');
      table.setNullable('world_filename');
      table.dropUnique(null, 'place_slug_unique');
      table.setNullable('slug');
      table.index('slug');
    });
  }
}


export async function down(knex: Knex): Promise<void> {
  await knex.raw('SET foreign_key_checks = 0');
  await knex.schema.table('place', table => {
    table.dropColumn('map_background_index');
    table.dropColumn('map_icon_index');
    table.dropColumn('member_id');
    table.dropColumn('home_id');
    table.unique(['slug']);
    table.dropNullable('slug');
    table.dropNullable('assets_dir');
    table.dropNullable('world_filename');
    table.dropIndex('slug');
  });
  await knex.raw('SET foreign_key_checks = 1');
}

