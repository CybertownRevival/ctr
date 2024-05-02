/* eslint-disable */
import { Knex } from 'knex';

/** Insert avatar records for each avatar in spa/assets  */
export async function seed(knex: Knex): Promise<void> {
  console.log('Fixing image value for exisiting avatars');
  await knex('avatar')
    .where('image', null)
    .where('member_id', null)
    .update({
      image: knex.raw("REPLACE(filename, '.wrl', '.png')")
    });
}
