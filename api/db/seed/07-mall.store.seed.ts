import { Knex } from 'knex';

const storeData = require('./../seed_data/store_data.json');

export async function seed(knex: Knex): Promise<void> {
    console.log('Seeding store data');
    
    await knex('place').insert(storeData);
}
