import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  console.log('Seeding Club Directory Place data');
  
  await knex('place').insert({
    assets_dir: null,
    description: 'Welcome to Clubs Directory',
    name: 'Clubs Directory',
    slug: 'clubdir',
    status: 1,
    world_filename: null,
    type: 'public',
    map_background_index: null,
    map_icon_index: null,
    member_id: null,
    messageboard_intro: null,
    inbox_intro: null,
    private: 0,
  });
  
  await knex('place').insert({
    assets_dir: null,
    description: 'Welcome to Newcomers Club',
    name: 'Newcomers Club',
    slug: 'newcomers',
    status: 1,
    world_filename: null,
    type: 'public',
    map_background_index: null,
    map_icon_index: null,
    member_id: null,
    messageboard_intro: null,
    inbox_intro: null,
    private: 0,
  });
}
