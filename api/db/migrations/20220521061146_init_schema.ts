import { Knex } from 'knex';

const COLLATE = 'utf8mb4_unicode_ci';
function applyCommon(table: Knex.CreateTableBuilder) {
  table.collate(COLLATE);
  table.increments('id');
  table.timestamps();
}

export async function up(knex: Knex): Promise<void> {
  if (!await knex.schema.hasTable('avatar')) {
    await knex.schema.createTable('avatar', table => {
      applyCommon(table);

      // table.timestamp('added_ts')
      //   .defaultTo(knex.raw('CURRENT_TIMESTAMP'))
      //   .notNullable();

      table.string('filename')
        .notNullable();

      table.text('gestures');

      table.integer('member_id')
        .defaultTo(0)
        .notNullable();

      table.string('name')
        .notNullable();

      table.tinyint('private')
        .defaultTo(0)
        .notNullable();

      table.tinyint('status')
        .defaultTo(2)
        .notNullable();
    });
  }

  if(!await knex.schema.hasTable('member')) {
    await knex.schema.createTable('member', table => {
      applyCommon(table);

      table.tinyint('avatar_id')
        .unsigned()
        .defaultTo(1)
        .notNullable()
        .references('id')
        .inTable('avatar');
      
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
      applyCommon(table);

      table.string('assets_dir')
        .defaultTo(null);

      table.text('description');

      table.string('name')
        // unique?
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
      applyCommon(table);

      table.text('body')
        .notNullable();

      table.integer('member_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('member')
        .onDelete('CASCADE');

      table.integer('place_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('place')
        .onDelete('CASCADE');

      table.tinyint('status')
        .unsigned()
        .defaultTo(1)
        .notNullable();
    });
  }

  if (!await knex.schema.hasTable('object')) {
    await knex.schema.createTable('object', table => {
      applyCommon(table);

      table.text('description');

      table.string('filename')
        .notNullable();

      table.string('image')
        .defaultTo(null);

      table.integer('member_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('member')
        .onDelete('RESTRICT');

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
      applyCommon(table);

      table.integer('object_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('object')
        .onDelete('CASCADE');

      table.integer('member_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('member')
        .onDelete('CASCADE');

      table.integer('place_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('place')
        .onDelete('CASCADE');

      table.text('position');

      table.text('rotation');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  knex.schema.dropTableIfExists('avatar');
  knex.schema.dropTableIfExists('member');
  knex.schema.dropTableIfExists('message');
  knex.schema.dropTableIfExists('object');
  knex.schema.dropTableIfExists('object_instance');
  knex.schema.dropTableIfExists('place');
}

