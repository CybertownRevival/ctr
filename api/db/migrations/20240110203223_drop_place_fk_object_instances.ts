import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.table('object_instance', function (table) {
    table.dropForeign('place_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table('object_instance', function (table) {
    table.foreign('place_id').references('place.id');
  });
}
