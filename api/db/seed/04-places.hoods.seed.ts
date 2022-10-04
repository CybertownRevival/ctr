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


function location2dto1d(location2d, width) {
  const stringCoords = String(location2d).padStart(4, '0'),
    coords = stringCoords.match(/.{1,2}/g);

  console.log('string coords: '+stringCoords);
  console.log('coords: '+coords);


  return (parseInt(coords[0]) - 1) * width + (parseInt(coords[1]) - 1) + 1;

  /*
  //(x-1)*n+(y-1)=z
  Actually it's mapping 2d array onto 1d array so (x-1)*n+(y-1)=z

n is width so 6
z is 1d index

I added the -1s as a quick way to convert from 1 based index to zero based
The z is zero based so add one to it*/

}

// todo upload assets for 9thD and campus
// todo have a big array of data to loop

export async function seed(knex: Knex): Promise<void> {
  console.log('Creating seed places hoods and blocks');

  // todo remove map_location ref for hoods and blocks

  // remove hoods and blocks from places
  await knex('place').del().whereIn(
    'type', ['hood','block'],
  );


  // loop through colonyidstoSlugs
  for(const colRef of colonyIdsToSlugs) {
    let hoodId = null,
      blocks = hoodBlockData.filter((row) => {
        return row.colony_id === parseInt(colRef.oldId)
      });

    console.log(colRef);

    //console.log(blocks);

    // get the place id of the colony in place table
    console.log(colRef.slug);
    const [colony] = await db.place.where({ slug: colRef.slug });

    console.log(colony);

    for(const block of blocks) {
      console.log(block);
      if(block.hood_name !== null) {

        //  new hood id? yes -> create place and fetch new place id
        if(hoodId !== block.h_id) {
          console.log('new hood...create it');
          hoodId = block.h_id;
          let newHoodId = await db.place.insert(
            {
              name: block.hood_name,
              type: 'hood',
              assets_dir: '',
              slug: block.h_id,
              world_filename: '',
            },
          );
          console.log('new hood id: ' + newHoodId);


          const newLocation = location2dto1d(block.hood_map_coord,8);

          console.log('new hood location: ' + newLocation);

          //  todo insert hood map_location with rel to colony place id (store in var)
          await db.mapLocation.insert({
            parent_place_id: colony.id,
            place_id: newHoodId[0],
            location: newLocation,
          });

        }

        //  todo sanitize the block's name
        //  todo if "Closed" or name is null don't insert or not avail some how
        //    todo replace BR with space
        //    todo if super natural, sea of ships, caribbean islands, metaverse, treasures of the deep, point
        //     world, nexus
        //     hood => get the image's alt
        //  todo insert place for block and fetch new place id for block
        //  todo  insert block map_location with rel to hood place id
        // todo end loop
      }

    }
  }



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
