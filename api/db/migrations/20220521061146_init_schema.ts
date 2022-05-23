import { Knex } from 'knex';

const COLLATE = 'utf8mb4_unicode_ci';
function applyCommon(table: Knex.CreateTableBuilder) {
  table.collate(COLLATE);
  table.increments('id').primary();
  table.timestamps(false, true);
}

export async function up(knex: Knex): Promise<void> {
  if (!await knex.schema.hasTable('avatar')) {
    await knex.schema.createTable('avatar', table => {
      console.log('Creating avatar table');
      applyCommon(table);

      // table.timestamp('added_ts')
      //   .defaultTo(knex.raw('CURRENT_TIMESTAMP'))
      //   .notNullable();

      table.string('filename')
        .notNullable();

      table.text('gestures');

      table.string('name')
        .notNullable();

      table.boolean('private') // should be bool
        .defaultTo(false)
        .notNullable();

      table.tinyint('status')
        .defaultTo(2)
        .notNullable();
    });
  }

  if(!await knex.schema.hasTable('member')) {
    await knex.schema.createTable('member', table => {
      console.log('Creating member table');
      applyCommon(table);

      table.integer('avatar_id')
        .unsigned()
        .defaultTo(1)
        .notNullable();
      table.foreign('avatar_id')
        .references('avatar.id');

      table.string('email')
        .unique()
        .notNullable();

      table.string('password')
        .notNullable();

      table.timestamp('password_reset_expire')
        .defaultTo(null);

      table.string('password_reset_token')
        .defaultTo(null);

      table.tinyint('status')
        .unsigned()
        .defaultTo(1)
        .notNullable();

      table.string('username')
        .unique()
        .notNullable();
    });
  }

  if (!await knex.schema.hasTable('place')) {
    await knex.schema.createTable('place', table => {
      console.log('Creating place table');
      applyCommon(table);

      table.string('assets_dir')
        .notNullable();

      table.text('description');

      table.string('name')
        .notNullable();

      table.string('slug')
        .unique()
        .notNullable();

      table.tinyint('status')
        .unsigned()
        .defaultTo(1)
        .notNullable();

      table.string('world_filename')
        .notNullable();
    });
  }

  if (!await knex.schema.hasTable('message')) {
    await knex.schema.createTable('message', table => {
      console.log('Creating message table');
      applyCommon(table);

      table.text('body')
        .notNullable();

      table.integer('member_id')
        .unsigned()
        .notNullable();
      table.foreign('member_id')
        .references('member.id');

      table.integer('place_id')
        .unsigned()
        .notNullable();
      table.foreign('place_id')
        .references('place.id');

      table.tinyint('status')
        .unsigned()
        .defaultTo(1)
        .notNullable();
    });
  }

  if (!await knex.schema.hasTable('object')) {
    await knex.schema.createTable('object', table => {
      console.log('Creating object table');
      applyCommon(table);

      table.text('description');

      table.string('filename')
        .notNullable();

      table.string('image')
        .defaultTo(null);

      table.integer('member_id')
        .unsigned()
        .notNullable();
      table.foreign('member_id')
        .references('member.id');

      table.string('name')
        .notNullable();

      table.integer('quantity')
        .defaultTo(0)
        .notNullable();

      table.tinyint('status')
        .defaultTo(2)
        .notNullable();
    });
  }

  if (!await knex.schema.hasTable('object_instance')) {
    await knex.schema.createTable('object_instance', table => {
      console.log('Creating object_instance table');
      applyCommon(table);

      table.integer('object_id')
        .unsigned()
        .notNullable();
      table.foreign('object_id')
        .references('object.id');

      table.integer('member_id')
        .unsigned()
        .notNullable();
      table.foreign('member_id')
        .references('member.id');

      table.integer('place_id')
        .unsigned()
        .notNullable();
      table.foreign('place_id')
        .references('place.id');

      table.text('position');

      table.text('rotation');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  console.log('Dropping avatar,member,message,object,object_instance,place tables');
  await knex.raw('SET foreign_key_checks = 0');
  await knex.schema.dropTable('avatar');
  await knex.schema.dropTable('member');
  await knex.schema.dropTable('message');
  await knex.schema.dropTable('object');
  await knex.schema.dropTable('object_instance');
  await knex.schema.dropTable('place');
  await knex.raw('SET foreign_key_checks = 1');
}

