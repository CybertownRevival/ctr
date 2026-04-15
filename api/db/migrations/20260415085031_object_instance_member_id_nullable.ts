import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('object_instance', table => {
    table.dropForeign(['member_id']);
  });

  await knex.schema.alterTable('object_instance', table => {
    table.integer('member_id').unsigned().nullable().alter();
  });

  await knex.schema.alterTable('object_instance', table => {
    table.foreign('member_id').references('member.id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('object_instance', table => {
    table.dropForeign(['member_id']);
  });

  await knex.schema.alterTable('object_instance', table => {
    table.integer('member_id').unsigned().notNullable().alter();
  });

  await knex.schema.alterTable('object_instance', table => {
    table.foreign('member_id').references('member.id');
  });
}
