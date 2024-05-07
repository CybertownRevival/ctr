/* eslint-disable */
import { Knex } from 'knex';

/** Insert avatar records for each avatar in spa/assets  */
export async function seed(knex: Knex): Promise<void> {
  console.log('Fixing directory value for exisiting avatars');
  await knex('avatar')
    .where('directory', null)
    .update({
      directory: knex.ref('id'),
    });
}
