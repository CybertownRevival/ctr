import { Knex } from 'knex';

const COLLATE = 'utf8mb4_unicode_ci';

const designerHomesPlace = {
  name: 'Designer Homes',
  description: 'Designer Homes',
  slug: 'deshomes',
  assets_dir: null,
  world_filename: null,
  type: 'public',
};

const designerHomeStores = [
  { name: 'Aquatic', slug: 'deshomes_aquatic' },
  { name: 'Fantasy', slug: 'deshomes_fantasy' },
  { name: 'Futuristic', slug: 'deshomes_futuristic' },
  { name: 'Landscapes', slug: 'deshomes_landscapes' },
  { name: 'Starter Homes', slug: 'deshomes_starter' },
  { name: 'General Homes', slug: 'deshomes_general' },
  { name: 'Seasonal Homes', slug: 'deshomes_seasonal' },
  { name: 'Castleworks Homes', slug: 'deshomes_castleworks' },
].map(store => ({
  ...store,
  description: store.name,
  assets_dir: null,
  world_filename: null,
  type: 'deshomeshop',
}));

function applyCommon(table: Knex.CreateTableBuilder) {
  table.collate(COLLATE);
  table.increments('id').primary();
  table.timestamps(false, true);
}

export async function up(knex: Knex): Promise<void> {
  if (!await knex.schema.hasTable('designer_home')) {
    console.log('Creating designer_home table...');
    await knex.schema.createTable('designer_home', table => {
      applyCommon(table);

      table.integer('member_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('member')
        .onDelete('SET NULL');

      table.integer('place_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('place');

      table.string('name', 64)
        .notNullable();

      table.integer('price')
        .unsigned()
        .notNullable();

      table.string('directory')
        .notNullable();

      table.string('filename')
        .notNullable();

      table.string('image')
        .notNullable();

      table.tinyint('status')
        .unsigned()
        .defaultTo(2)
        .notNullable();
    });
  }

  if (!await knex.schema.hasTable('designer_home_owner')) {
    console.log('Creating designer_home_owner table...');
    await knex.schema.createTable('designer_home_owner', table => {
      applyCommon(table);

      table.integer('member_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('member')
        .onDelete('CASCADE');

      table.integer('designer_home_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('designer_home')
        .onDelete('CASCADE');

      table.unique(['member_id', 'designer_home_id']);
    });
  }

  if (!await knex.schema.hasTable('designer_home_ban')) {
    console.log('Creating designer_home_ban table...');
    await knex.schema.createTable('designer_home_ban', table => {
      applyCommon(table);

      table.integer('member_id')
        .unsigned()
        .notNullable()
        .unique()
        .references('id')
        .inTable('member')
        .onDelete('CASCADE');

      table.integer('banned_by_member_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('member')
        .onDelete('SET NULL');
    });
  }

  if (!await knex.schema.hasTable('setting')) {
    console.log('Creating setting table...');
    await knex.schema.createTable('setting', table => {
      table.collate(COLLATE);
      table.string('name').primary();
      table.string('value');
      table.timestamps(false, true);
    });
  }

  if (!await knex('setting').where({ name: 'deshomes_upload_status' }).first()) {
    await knex('setting').insert({ name: 'deshomes_upload_status', value: 'ON' });
  }

  console.log('Adding Designer Homes places...');
  for (const place of [designerHomesPlace, ...designerHomeStores]) {
    if (!await knex('place').where({ slug: place.slug }).first()) {
      await knex('place').insert(place);
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  console.log('Dropping Designer Homes tables...');
  await knex.schema.dropTableIfExists('setting');
  await knex.schema.dropTableIfExists('designer_home_ban');
  await knex.schema.dropTableIfExists('designer_home_owner');
  await knex.schema.dropTableIfExists('designer_home');

  console.log('Removing Designer Homes places...');
  await knex('place')
    .whereIn('slug', [designerHomesPlace.slug, ...designerHomeStores.map(store => store.slug)])
    .del();
}
