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
  console.log('Adding voting seeds...');
  await knex('vote_list').insert({
    title: 'Mayor Election 2026',
    place_id: 1,
    creator_member_id: null,
    description: 'Vote for the next mayor of Cybertown',
    expires_at: null,
  });
  await knex('vote_options').insert([
    {
      vote_id: 1,
      option_text: 'EmperorAjay',
    },
    {
      vote_id: 1,
      option_text: 'MorningStar',
    },
    {
      vote_id: 1,
      option_text: 'phil_00',
    },
  ]);
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

