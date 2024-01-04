import { Knex } from 'knex';

const donorData = require('./../seed_data/donor_data.json');

export async function seed(knex: Knex): Promise<void> {
    console.log('Seeding donor data');
    
    await knex('role').insert(donorData);
}
