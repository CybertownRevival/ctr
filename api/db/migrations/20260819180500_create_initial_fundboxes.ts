import { Knex } from 'knex';

const eligibleSlugs = [
  // Active Colonies
  '9thdimension',
  'ad_col',
  'campus',
  'cyberhood',
  'ent_col',
  'games_col',
  'hitek_col',
  'inrlms_col',
  'scifi_col',
  'vrtwrlds_col',

  // Approved City Places
  'bank',
  'beach',
  'blackmarket',
  'cityhall',
  'clubdir',
  'employment',
  'fleamarket',
  'funpark',
  'jail',
  'mall',
  'newcomers',
  'pool',
  'postoffice',
  'theatre',
  'themepark',
  'waterpark',
];

export async function up(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    for (const slug of eligibleSlugs) {
      const place = await trx('place')
        .where({
          slug,
          status: 1,
        })
        .first();

      if (!place) {
        throw new Error(`Eligible Fundbox place not found: ${slug}`);
      }

      const existingFundbox = await trx('fundbox')
        .where({ place_id: place.id })
        .first();

      if (existingFundbox) {
        continue;
      }

      const [walletId] = await trx('wallet').insert({ balance: 0 });

      await trx('fundbox').insert({
        place_id: place.id,
        wallet_id: walletId,
      });
    }
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.transaction(async trx => {
    const places = await trx('place')
      .select('id')
      .whereIn('slug', eligibleSlugs);

    const placeIds = places.map(place => place.id);

    const fundboxes = await trx('fundbox')
      .select('wallet_id')
      .whereIn('place_id', placeIds);

    const walletIds = fundboxes.map(fundbox => fundbox.wallet_id);

    await trx('fundbox')
      .whereIn('place_id', placeIds)
      .del();

    if (walletIds.length > 0) {
      await trx('wallet')
        .whereIn('id', walletIds)
        .del();
    }
  });
}
