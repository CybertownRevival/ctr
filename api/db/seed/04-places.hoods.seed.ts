import { Knex } from 'knex';
import { db } from '../../src/db';

const hoodBlockData = require('./../seed_data/hood_block_data.json');

const colonyIdsToSlugs = [
  {'slug': 'games_col', 'oldId': '0101'},
  {'slug': 'scifi_col', 'oldId': '0102'},
  {'slug': 'vrtwrlds_col', 'oldId': '0103'},
  {'slug': 'ent_col', 'oldId': '0104'},
  {'slug': 'inrlms_col', 'oldId': '0105'},
  {'slug': 'teen_col', 'oldId': '0106'},
  {'slug': 'morningstar', 'oldId': '0107'},
  {'slug': 'cyberhood', 'oldId': '0108'},
  {'slug': 'ad_col', 'oldId': '0109'},
  {'slug': 'hitek_col', 'oldId': '0110'},
];


// todo upload assets for 9thD and campus
// todo have a big array of data to loop

export async function seed(knex: Knex): Promise<void> {
  console.log('Creating seed places hoods and blocks');

  // todo remove map_location ref for hoods and blocks

  // remove hoods and blocks from places
  await knex('place').del().whereIn(
    'type', ['hood','block']
  );

  //console.log(hoodBlockData);

  // loop through colonyidstoSlugs
  colonyIdsToSlugs.forEach( async (colRef) => {
    let hoodId = null,
      blocks = hoodBlockData.filter((row) => {
        return row.colony_id === parseInt(colRef.oldId)
      });

    console.log(colRef);

    //console.log(blocks);

    // todo get the place id of the colony in place table
    console.log(colRef.slug);
    //const [colony] = await db.place.where({ slug: colRef.slug });
    const [colony] = await knex('place').select('id').where({ slug: colRef.slug });

    console.log(colony);
    // loop through the blocks
    blocks.forEach(block => {
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

    })
  });


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
