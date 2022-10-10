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

  return (parseInt(coords[0]) - 1) * width + (parseInt(coords[1]) - 1) + 1;
}

function cleanBlockName(blockName) {

  if (blockName === null) {
    return blockName;
  }

  let regex = new RegExp("alt='(.*)'", "g");
  let match = regex.exec(blockName);

  if(match !== null) {
    return match[1];
  } else {
    blockName = blockName.replace("<BR>", " ");
    blockName = blockName.replace("<br>", " ");
    blockName = blockName.replace("<B>", " ");
    blockName = blockName.replace("<b>", " ");
    blockName = blockName.replace("</B>", " ");
    blockName = blockName.replace("</b>", " ");
    blockName = blockName.replace("</a>", " ");
    blockName = blockName.replace("<img src='http://hermes.spaceports.com/~hitman/sk_map/a1.jpg' class='a1b' border='0'>", " ");
    blockName = blockName.replace("<font face=tahoma>", " ");
    blockName = blockName.replace("<font color=#CCCC99>", " ");
    blockName = decodeURIComponent(blockName);

    const placeholder = blockName.match(/^(ai|sc|nex|ds|d|qi)([0-9]+)$/g);
    if(placeholder !== null) {
      return null;
    }
  }
  return blockName;

}

// todo upload assets for 9thD and campus

export async function seed(knex: Knex): Promise<void> {
  console.log('Creating seed places hoods and blocks');

  // remove map_location ref for hoods and blocks
  // todo remove this from seed. shouldn't be allowed to reverse this easy
  console.log('Removing map locations...');
  await knex('map_location').del();

  // remove hoods and blocks from places
  // todo remove this from seed. shouldn't be allowed to reverse this easy
  console.log('Removing hoods and blocks from place table...');
  await knex('place').del().whereIn(
    'type', ['hood','block'],
  );


  // loop through colonyidstoSlugs
  for(const colRef of colonyIdsToSlugs) {
    let hoodId = null,
      newHood = null,
      blocks = hoodBlockData.filter((row) => {
        return row.colony_id === parseInt(colRef.oldId)
      });

    console.log('Processing ' + colRef.slug + ' block data...');
    // get the place id of the colony in place table
    const [colony] = await db.place.where({ slug: colRef.slug });
    console.log(colony);

    console.log(blocks.length + " blocks to process...");

    for(const block of blocks) {
      const blockName = cleanBlockName(block.block_name);

      if(block.hood_name !== null && blockName !== 'Closed' && blockName !== null && block.block_map_coord !== 0) {

        //  new hood id? yes -> create place and fetch new place id
        if(hoodId !== block.h_id) {

          console.log('Creating Hood: '+ block.hood_name);

          hoodId = block.h_id;
          const newHoodId = await db.place.insert(
            {
              name: block.hood_name,
              type: 'hood',
              assets_dir: '',
              slug: block.h_id,
              world_filename: '',
            },
          );

          const newLocation = location2dto1d(block.hood_map_coord,8);

          newHood = newHoodId[0];

          //  insert hood map_location with rel to colony place id (store in var)
          await db.mapLocation.insert({
            parent_place_id: colony.id,
            place_id: newHood,
            location: newLocation,
          });

        }

        console.log('Creating Block: ' + blockName);

        const newBlockId = await db.place.insert(
          {
            name: blockName,
            type: 'block',
            assets_dir: '',
            slug: block.b_id,
            world_filename: '',
          },
        );

        const newBlockLocation = location2dto1d(block.block_map_coord,6);

        //  insert block map_location with rel to hood place id
        await db.mapLocation.insert({
          parent_place_id: newHood,
          place_id: newBlockId[0],
          location: newBlockLocation,
        });
      }
    }
  }


  // todo migrate morningstar -> 9th dim

  // todo migrate teen -> campus

};
