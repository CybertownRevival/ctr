import { Knex } from 'knex';


export async function up(knex: Knex): Promise<void> {
  console.log('Adding place.private column');
  if (await knex.schema.hasTable('place')) {
    if (!await knex.schema.hasColumn('place', 'private')) {
      await knex.schema.table('place', table => {
        table.boolean('private').notNullable().defaultTo(false);
      });
    } else {
      console.log('Column place.private already exists');
    }
  } else {
    console.log('Table place does not exist');
  }
}


export async function down(knex: Knex): Promise<void> {

  console.log('Dropping place.private column');
  if (await knex.schema.hasTable('place')) {
    if (await knex.schema.hasColumn('place', 'private')) {
      await knex.schema.table('place', table => {
        table.dropColumn('private');
      });
    }
  }
}

