/* eslint-disable */
import { Knex } from 'knex';

/** Insert avatar records for each avatar in spa/assets  */
export async function seed(knex: Knex): Promise<void> {
  console.log('Creating seed avatars');
  await knex('avatar').insert([
    {
      name: 'default',
      status: 1,
      gestures: '[\"Hallo\",\"Hey\",\"Agree\",\"Like\",\"Dislike\",\"Disagree\",\"Not now\",\"Good bye\",\"Appear\",\"Disappear\"]',
      filename: 'default.wrl',
    },
    {
      name: 'Tonaki\'s m1',
      status: 1,
      gestures: '[\"Bonjour01\",\"Rire jim\",\"Frowns jim\",\"Agrees jim\",\"Smiles jim\",\"Disagrees jim\",\"Non jim\",\"Rejet jim\",\"Good by jim\",\"Superzen lil\",\"Pose homme\",\"Marche\"]',
      filename: 'm1.wrl',
    },
    {
      name: 'Davis',
      status: 1,
      filename: 'davis.wrl',
    },
    {
      name: 'George',
      status: 1,
      filename: 'george.wrl',
    },
    {
      name: 'Jeni',
      status: 1,
      filename: 'jeni.wrl',
    },
    {
      name: 'Keli',
      status: 1,
      filename: 'jeni.wrl',
    },
    {
      name: 'Ken',
      status: 1,
      filename: 'jeni.wrl',
    },
    {
      name: 'Lili',
      status: 1,
      filename: 'lili.wrl',
    },
    {
      name: 'Lora',
      status: 1,
      filename: 'lora.wrl',
    },
    {
      name: 'Abu',
      status: 1,
      filename: 'abu.wrl',
    },
    {
      name: 'Jaz',
      status: 1,
      filename: 'jaz.wrl',
    },
  ]);
}
