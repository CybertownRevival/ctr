import { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
  return knex.schema
    // 1. Table for the main Vote/Poll metadata
    .createTable('vote_list', (table) => {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.integer('place_id').unsigned().notNullable();
      table.foreign('place_id').references('id').inTable('places').onDelete('CASCADE');
      table.integer('creator_member_id').unsigned().notNullable();
      table.foreign('creator_member_id').references('id').inTable('members').onDelete('CASCADE');
      table.text('description');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('expires_at');
    })
    
    // 2. Table for the specific options within a vote
    .createTable('vote_options', (table) => {
      table.increments('id').primary();
      table.string('option_text').notNullable();
      // Foreign key to votes table
      table.integer('vote_id').unsigned().notNullable()
        .references('id').inTable('vote_list')
        .onDelete('CASCADE');
    })
    
    // 3. Table for member responses/ballots
    .createTable('vote_response', (table) => {
      table.increments('id').primary();
      
      // Foreign key to votes table
      table.integer('vote_id').unsigned().notNullable()
        .references('id').inTable('vote_list')
        .onDelete('CASCADE');
        
      // Foreign key to options table (which choice did they pick?)
      table.integer('option_id').unsigned().notNullable()
        .references('id').inTable('vote_options')
        .onDelete('CASCADE');
        
      // Foreign key to members table
      table.integer('member_id').unsigned().notNullable()
        .references('id').inTable('members')
        .onDelete('CASCADE');

      // Optional bid amount for mayor votes
      table.string('bid');

      // Timestamp for when the vote was cast

      table.timestamp('voted_at').defaultTo(knex.fn.now());
      
      // Ensure a member can only vote once per specific poll
      table.unique(['vote_id', 'member_id']);
    });
}


export async function down(knex: Knex): Promise<void> {
  return knex.schema
    .dropTableIfExists('vote_response')
    .dropTableIfExists('vote_options')
    .dropTableIfExists('vote_list');
}

