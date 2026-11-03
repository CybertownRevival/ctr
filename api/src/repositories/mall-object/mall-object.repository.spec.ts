import dotenv from 'dotenv';

// `knexfile` reads `../.env`, which resolves correctly for the running API but
// not for jest, whose cwd is `api/`. Loaded here so these tests talk to the
// same database the API does.
dotenv.config();

import { Db } from '../../db/db.class';
import { MallRepository } from './mall-object.repository';

/**
 * `getStoresByObjectIds`'s placement columns, against a real MySQL.
 *
 * `getAllStoresByObjectId` and `getStoresByObjectIds` must expose the exact
 * same shape -- `mall_position`/`mall_rotation` aliases included -- since the
 * export's `buildObject` reads those fields regardless of which one supplied
 * the store map. A mocked repository cannot catch a query that silently
 * dropped two selected columns; only running the real SQL can.
 *
 * These tests write fixture rows and delete them again, so a reachable
 * database is deliberately not enough to run them -- see
 * `integrationDbAuthorized`. Without the explicit opt-in they register as
 * skipped, never as a silent pass.
 */

/**
 * Whether this spec may write fixture rows to the configured database.
 *
 * `DB_HOST` and `DB_DATABASE` only prove a database is reachable. The API's
 * ordinary environment defines both, and they can name a shared or production
 * database where fixture INSERTs and cleanup DELETEs must never run. The
 * destructive path therefore additionally requires `CTR_INTEGRATION_TEST_DB`
 * to name the configured database exactly -- an explicit, per-environment
 * assertion that this specific database is disposable and dedicated to
 * integration testing, not merely present in the environment.
 */
function integrationDbAuthorized(env: NodeJS.ProcessEnv): boolean {
  return Boolean(
    env.DB_HOST
    && env.DB_DATABASE
    && env.CTR_INTEGRATION_TEST_DB
    && env.CTR_INTEGRATION_TEST_DB === env.DB_DATABASE,
  );
}

const PLACEMENT = {
  position: '{"x":1,"y":2,"z":3}',
  rotation: '{"x":0,"y":1,"z":0,"angle":1.5}',
};

/**
 * The opt-in itself, provable without any database: ordinary configuration
 * must never arm the destructive path.
 */
describe('integration opt-in for MallRepository fixtures', () => {
  it('is never granted by ordinary database configuration alone', () => {
    expect(integrationDbAuthorized({ DB_HOST: 'db', DB_DATABASE: 'cybertown' })).toBe(false);
  });

  it('is not granted when the opt-in names a different database', () => {
    expect(integrationDbAuthorized({
      DB_HOST: 'db',
      DB_DATABASE: 'cybertown',
      CTR_INTEGRATION_TEST_DB: 'cybertown_test',
    })).toBe(false);
  });

  it('is not granted by an empty opt-in', () => {
    expect(integrationDbAuthorized({
      DB_HOST: 'db',
      DB_DATABASE: 'cybertown',
      CTR_INTEGRATION_TEST_DB: '',
    })).toBe(false);
  });

  it('is granted only when the opt-in names the configured database exactly', () => {
    expect(integrationDbAuthorized({
      DB_HOST: 'db',
      DB_DATABASE: 'cybertown_itest',
      CTR_INTEGRATION_TEST_DB: 'cybertown_itest',
    })).toBe(true);
  });
});

describe('MallRepository.getStoresByObjectIds (real database)', () => {
  let db: Db;
  let repository: MallRepository;
  const authorized = integrationDbAuthorized(process.env);

  /**
   * Ids the database itself minted for this run's fixtures -- the only rows
   * cleanup may delete. Auto-generated instead of predictable constants, so a
   * run can never collide with, or delete, a row it did not insert.
   */
  let fixturePlaceIds: number[] = [];
  let fixtureObjectIds: number[] = [];
  let placeId: number;
  let placedObjectId: number;
  let unplacedObjectId: number;

  beforeAll(async () => {
    if (!authorized) {
      return;
    }
    db = new Db();
    await db.knex.raw('select 1');
  });

  afterAll(async () => {
    if (db) {
      await db.knex.destroy();
    }
  });

  beforeEach(async () => {
    if (!authorized) {
      return;
    }
    repository = new MallRepository(db);
    // Inserted one row at a time because MySQL returns only the first
    // auto-generated id of a batch, and every minted id must be captured.
    [placeId] = await db.knex('place').insert({
      name: 'Fixture Store',
      type: 'shop',
      status: 1,
    });
    fixturePlaceIds.push(placeId);
    [placedObjectId] = await db.knex('object').insert({
      filename: 'placed-fixture.wrl',
      name: 'Placed Fixture',
    });
    fixtureObjectIds.push(placedObjectId);
    [unplacedObjectId] = await db.knex('object').insert({
      filename: 'unplaced-fixture.wrl',
      name: 'Unplaced Fixture',
    });
    fixtureObjectIds.push(unplacedObjectId);
    await db.knex('mall_object').insert({
      object_id: placedObjectId,
      place_id: placeId,
      position: PLACEMENT.position,
      rotation: PLACEMENT.rotation,
    });
  });

  afterEach(async () => {
    if (!authorized) {
      return;
    }
    // Scoped to the ids this run's own inserts returned, never to a
    // predictable constant an unrelated row could happen to occupy.
    if (fixtureObjectIds.length > 0) {
      await db.knex('mall_object').whereIn('object_id', fixtureObjectIds).del();
      await db.knex('object').whereIn('id', fixtureObjectIds).del();
    }
    if (fixturePlaceIds.length > 0) {
      await db.knex('place').whereIn('id', fixturePlaceIds).del();
    }
    fixtureObjectIds = [];
    fixturePlaceIds = [];
  });

  /** Registers as a real test, or as a visible skip -- never a silent pass. */
  const dbTest = authorized ? it : it.skip;

  // Runs precisely when the fixtures above may not: without the opt-in this
  // proves the destructive path was never armed -- no connection was even
  // opened, so no INSERT or DELETE can have happened.
  (authorized ? it.skip : it)('opens no database connection without the opt-in', () => {
    expect(db).toBeUndefined();
  });

  dbTest(
    'exposes the same mall_position/mall_rotation aliases as getAllStoresByObjectId',
    async () => {
      const scoped = await repository.getStoresByObjectIds([placedObjectId, unplacedObjectId]);
      const all = await repository.getAllStoresByObjectId();

      expect(scoped[placedObjectId]).toBeDefined();
      expect(scoped[placedObjectId].mall_position).toBe(PLACEMENT.position);
      expect(scoped[placedObjectId].mall_rotation).toBe(PLACEMENT.rotation);
      expect(scoped[unplacedObjectId]).toBeUndefined();

      expect(all[placedObjectId].mall_position).toBe(scoped[placedObjectId].mall_position);
      expect(all[placedObjectId].mall_rotation).toBe(scoped[placedObjectId].mall_rotation);
    },
  );

  dbTest('returns nothing for ids outside the requested set', async () => {
    const scoped = await repository.getStoresByObjectIds([unplacedObjectId]);

    expect(Object.keys(scoped)).toEqual([]);
  });
});
