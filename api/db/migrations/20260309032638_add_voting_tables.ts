import { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
  console.log('Creating vote_list table...');
  await knex.schema
    // 1. Table for the main Vote/Poll metadata
    .createTable('vote_list', (table) => {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.integer('place_id').unsigned().notNullable();
      table.foreign('place_id').references('id').inTable('place');
      table.integer('creator_member_id').unsigned();
      table.text('description');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('expires_at').nullable();
    })

    // 2. Table for the specific options within a vote
    .createTable('vote_options', (table) => {
      console.log('Creating vote_options table...');
      table.increments('id').primary();
      table.string('option_text').notNullable();
      // Foreign key to votes table
      table.integer('vote_id').unsigned().notNullable()
        .references('id').inTable('vote_list');
    })

    // 3. Table for member responses/ballots
    .createTable('vote_response', (table) => {
      console.log('Creating vote_response table...');
      table.increments('id').primary();

      //status of the vote
      table.integer('status').notNullable().defaultTo(1);

      // Foreign key to votes table
      table.integer('vote_id').unsigned().notNullable()
        .references('id').inTable('vote_list');

      // Foreign key to options table (which choice did they pick?)
      table.integer('option_id').unsigned().notNullable()
        .references('id').inTable('vote_options');

      // Foreign key to members table
      table.integer('member_id').unsigned().notNullable()
        .references('id').inTable('member');

      // Optional bid amount for mayor votes
      table.string('bid');

      // Timestamp for when the vote was cast

      table.timestamp('voted_at').defaultTo(knex.fn.now());

      // Ensure a member can only vote once per specific poll
      table.unique(['vote_id', 'member_id']);
    });
  // The Mayor Election rows this migration used to insert now live in
  // db/seed/12-votes.seed.ts. They are content, not schema, and inserting them from here
  // made a fresh database impossible to build: `place_id` is a foreign key into `place`,
  // and migrations run before seeds, so on an empty database there was no place to point
  // at. It also assumed the new table would hand out vote id 1 for the options.
  //
  // Databases created before this change already ran the migration and already hold these
  // rows; the seed is idempotent, so it is a no-op for them.
  return;
}


export async function down(knex: Knex): Promise<void> {
  console.log('Dropping vote_response table...');
  console.log('Dropping vote_options table...');
  console.log('Dropping vote_list table...');
  return knex.schema
    .dropTableIfExists('vote_response')
    .dropTableIfExists('vote_options')
    .dropTableIfExists('vote_list');
}

