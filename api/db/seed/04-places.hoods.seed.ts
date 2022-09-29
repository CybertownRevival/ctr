import { Knex } from 'knex';

const colonyIdsToSlugs = {
  'games_col': '0101',
  'scifi_col': '0102',
  'vrtwrlds_col': '0103',
  'ent_col': '0104',
  'inrlms_col': '0105',
  'teen_col': '0106',
  'morningstar': '0107',
  'cyberhood': '0108',
  'ad_col': '0109',
  'hitek_col': '0110',
};

// todo upload assets for 9thD and campus
// todo have a big array of data to loop

export async function seed(knex: Knex): Promise<void> {
  console.log('Creating seed places hoods and blocks');

  // todo remove map_location ref for hoods and blocks

  // todo remove hoods and blocks
  await knex('place').del().where({
    type: ['hood','block'],
  });


  // todo loop through colonyidstoSlugs
  // todo get the place id of the colony in place
  // todo filter data to only those where colony_id = the old one
  // todo loop through the blocks
  //  todo new hood id? yes -> create place and fetch new place id
  //  todo insert hood map_location with rel to colony place id (store in var)
  //  todo sanitize the block's name
  //  todo if "Closed" or name is null don't insert or not avail some how
  //    todo replace BR with space
  //    todo if super natural, sea of ships, caribbean islands, metaverse, treasures of the deep, point
  //     world, nexus
  //     hood => get the image's alt
  //  todo insert place for block and fetch new place id for block
  //  todo  insert block map_location with rel to hood place id
  // todo end loop

  /*
  1. select the id of the X col
  2. insert hoods into place
  3. get hood ids
  4. insert into association table the ids of the above. relating them to the X col's id
   */

  // Inserts seed entries
  /*
  await knex("table_name").insert([
    { id: 1, colName: "rowValue1" },
    { id: 2, colName: "rowValue2" },
    { id: 3, colName: "rowValue3" }
  ]);
   */

  //todo: replace morning star with 9th Dimension

  //todo: replace teens with the campus
};
