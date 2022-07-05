import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  console.log('Creating seed places colonies');

  await knex('place').del().where({
    type: 'colony',
  });

  await knex('place').insert([
    {
      name: 'Games',
      description: 'Welcome to the Games Colony',
      slug: 'games_col',
      assets_dir: '/games_col/vrml/',
      world_filename: 'games_col.wrl',
      type: 'colony',
    },
    {
      name: 'Sci-fi',
      description: 'Welcome to the Sci-fi Colony',
      slug: 'scifi_col',
      assets_dir: '/scifi_col/vrml/',
      world_filename: 'scifi_col.wrl',
      type: 'colony',
    },
    {
      name: 'Virtual Worlds',
      description: 'Welcome to the Virtual Worlds Colony',
      slug: 'vrtwrlds_col',
      assets_dir: '/vrtwrlds_col/vrml/',
      world_filename: 'vrtwrlds_col.wrl',
      type: 'colony',
    },
    {
      name: 'Entertainment',
      description: 'Welcome to the Entertainment Colony',
      slug: 'ent_col',
      assets_dir: '/ent_col/vrml/',
      world_filename: 'ent_col.wrl',
      type: 'colony',
    },
    {
      name: 'Inner Realms',
      description: 'Welcome to the Inner Realms Colony',
      slug: 'inrlms_col',
      assets_dir: '/inrlms_col/vrml/',
      world_filename: 'inrlms_col.wrl',
      type: 'colony',
    },
    {
      name: 'Teens',
      description: 'Welcome to the Teens Colony',
      slug: 'teen_col',
      assets_dir: '/teen_col/vrml/',
      world_filename: 'teen_col.wrl',
      type: 'colony',
    },
    {
      name: 'Morning Star',
      description: 'Welcome to the Morning Star Colony',
      slug: 'morningstar',
      assets_dir: '/morningstar/vrml/',
      world_filename: 'morningstar.wrl',
      type: 'colony',
    },
    {
      name: 'Cyberhood',
      description: 'Welcome to the Cyberhood',
      slug: 'cyberhood',
      assets_dir: '/cyberhood/vrml/',
      world_filename: 'cyberhood.wrl',
      type: 'colony',
    },
    {
      name: 'Adventure',
      description: 'Welcome to the Adventure Colony',
      slug: 'ad_col',
      assets_dir: '/ad_col/vrml/',
      world_filename: 'ad_col.wrl',
      type: 'colony',
    },
    {
      name: 'Hi-Tek',
      description: 'Welcome to the Hi-Tek Colony',
      slug: 'hitek_col',
      assets_dir: '/hitek_col/vrml/',
      world_filename: 'hi-tek.wrl',
      type: 'colony',
    },
  ]);
};
