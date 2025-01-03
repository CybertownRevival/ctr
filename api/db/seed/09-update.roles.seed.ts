import {Knex} from 'knex';
const storeData = require('./../seed_data/update_roles_data.json');

export async function seed(knex: Knex): Promise<void> {
  console.log('Updating roles data');
  const promises = [];
  for(const newRoleData of storeData) {
    const p = (async () => {
      try {
        const rows = await knex('role')
          .where('name', '=', newRoleData.name);
        if (rows.length === 0) {
          console.log(`Adding ${newRoleData.name}`);
          await knex('role').insert(newRoleData);
        } else {
          console.log(`Updating ${newRoleData.name}`);
          await knex('role')
            .where('name', newRoleData.name)
            .update(newRoleData);
        }
      } catch (err) {
        console.error(`There was an error inserting or updating the role: ${newRoleData.name}`);
        console.error(err);
      }
    })();
    promises.push(p);
  }
  await Promise.all(promises);
}
