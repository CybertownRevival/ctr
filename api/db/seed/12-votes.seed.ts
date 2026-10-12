import { Knex } from 'knex';

const VOTE_TITLE = 'Mayor Election 2026';
const PLACE_SLUG = 'enter';
// The candidates 20260309032638_add_voting_tables used to insert, in its own order.
const CANDIDATES = ['EmperorAjay', 'MorningStar', 'phil_00'];

/**
 * The Mayor Election poll, moved out of 20260309032638_add_voting_tables.
 *
 * It used to be inserted by that migration, which meant a fresh database could not be
 * built at all: `place_id` is a foreign key into `place`, migrations run before seeds, and
 * on an empty database there is no place to point at. `npm run db:init` died on the
 * constraint before it ever reached the seeds.
 *
 * Resolving the place by slug rather than hardcoding id 1 also drops the assumption that
 * The Plaza is always row 1 -- true for a freshly seeded database, not guaranteed for one
 * rebuilt or restored in another order.
 *
 * The poll and its options are written in one transaction, so a crash between the two
 * inserts cannot leave a permanently optionless election behind: either the whole poll
 * lands or none of it does.
 *
 * Re-running is a no-op, but only once the poll is confirmed complete and in the right
 * place. A poll that is present but malformed is reported, not skipped and not rewritten --
 * repairing existing voting data is somebody's deliberate decision, not a seed's.
 */
export async function seed(knex: Knex): Promise<void> {
  await knex.transaction(async (trx) => {
    // `place.slug` lost its unique index in 20221019132059_place.map.images, so order the
    // lookup rather than trusting the storage engine to hand back the original row.
    const plaza = await trx('place')
      .where({ slug: PLACE_SLUG })
      .orderBy('id')
      .first('id');
    if (!plaza) {
      // Seeds run in filename order, so 02-places has already run in a normal db:init.
      // Failing loudly beats attaching the poll to some other place.
      throw new Error(
        `12-votes.seed: no place with slug '${PLACE_SLUG}' -- run the place seeds first`,
      );
    }

    const existing = await trx('vote_list')
      .where({ title: VOTE_TITLE })
      .orderBy('id')
      .select('id', 'place_id');

    if (existing.length > 1) {
      throw new Error(
        `12-votes.seed: found ${existing.length} polls titled '${VOTE_TITLE}'; ` +
        'expected at most one. Resolve the duplicates before seeding.',
      );
    }

    if (existing.length === 1) {
      await assertExistingPollIsUsable(trx, existing[0], plaza.id);
      console.log(`'${VOTE_TITLE}' already present and complete, skipping`);
      return;
    }

    console.log('Seeding Mayor Election vote data');

    // The id is read back rather than assumed to be 1: the options are only correct if they
    // point at the poll actually created here. MySQL has no RETURNING, so this is the
    // insert-then-read form knex gives us.
    const [voteId] = await trx('vote_list').insert({
      title: VOTE_TITLE,
      place_id: plaza.id,
      creator_member_id: null,
      description: 'Vote for the next mayor of Cybertown',
      expires_at: null,
    });

    await trx('vote_options').insert(
      CANDIDATES.map(option_text => ({ vote_id: voteId, option_text })),
    );
  });
}

/**
 * A poll with the right title is not automatically the poll we meant to seed. Skipping on
 * the title alone is what let a half-written election survive every later seed run.
 */
async function assertExistingPollIsUsable(
  trx: Knex.Transaction,
  poll: { id: number; place_id: number },
  expectedPlaceId: number,
): Promise<void> {
  if (poll.place_id !== expectedPlaceId) {
    throw new Error(
      `12-votes.seed: '${VOTE_TITLE}' (vote_list id ${poll.id}) is attached to place ` +
      `${poll.place_id}, but the seeded election belongs to the place with slug ` +
      `'${PLACE_SLUG}' (id ${expectedPlaceId}). Refusing to move an existing poll -- ` +
      'correct vote_list.place_id by hand if this is a bootstrap artefact.',
    );
  }

  const found: string[] = await trx('vote_options')
    .where({ vote_id: poll.id })
    .pluck('option_text');
  const missing = CANDIDATES.filter(candidate => !found.includes(candidate));

  // Length is checked as well as membership, so a duplicated candidate row is caught too.
  // That is why the surplus is reported as "unexpected option rows" rather than as
  // unrecognised values: a second copy of a candidate we do expect still counts here.
  if (missing.length > 0 || found.length !== CANDIDATES.length) {
    const unexpected = found.length - (CANDIDATES.length - missing.length);
    throw new Error(
      `12-votes.seed: '${VOTE_TITLE}' (vote_list id ${poll.id}) already exists but its ` +
      `options are wrong: expected ${CANDIDATES.length}, found ${found.length}` +
      `${missing.length > 0 ? `, missing ${missing.join(', ')}` : ''}` +
      `${unexpected > 0 ? `, ${unexpected} unexpected ` +
        `option row${unexpected === 1 ? '' : 's'}` : ''}. ` +
      'Repair the vote_options rows by hand -- this seed will not rewrite existing ' +
      'voting data.',
    );
  }
}
