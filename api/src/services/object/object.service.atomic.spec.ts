import dotenv from 'dotenv';
import { Knex } from 'knex';

// `knexfile` reads `../.env`, which resolves correctly for the running API but
// not for jest, whose cwd is `api/`. Loaded here so these tests talk to the same
// database the API does.
dotenv.config();

import { Db } from '../../db/db.class';
import {
  MallRepository,
  MemberRepository,
  ObjectInstanceRepository,
  ObjectRepository,
  TransactionRepository,
} from '../../repositories';
import { ObjectService } from './object.service';
import { Transaction } from '../../types/models';

/**
 * The rejection's transactional guarantees, against a real MySQL.
 *
 * These cannot be proven with mocks. Whether a wallet credit is rolled back when
 * a later write fails, and whether two concurrent rejections produce one refund
 * instead of two, are properties of the database and of `FOR UPDATE` - a mocked
 * repository would happily "prove" them either way.
 *
 * Skipped, loudly, when no database is reachable, so the ordinary unit suite
 * stays runnable without one.
 */
const FIXTURE = {
  walletId: 990001,
  memberId: 990001,
  objectId: 990001,
  /** A second object, same uploader and wallet, for the cross-object race. */
  secondObjectId: 990002,
  quantity: 10,
  price: 25,
};

/** 10 * 25 * 0.2 */
const EXPECTED_REFUND = FIXTURE.quantity * FIXTURE.price * ObjectService.SELLER_FEE_PERCENT;

describe('ObjectService rejection atomicity (real database)', () => {
  let db: Db;
  let service: ObjectService;
  let objectRepository: ObjectRepository;
  let transactionRepository: TransactionRepository;
  /**
   * Decided synchronously, at registration time, from whether the database is
   * even configured. When it is, the tests run for real and a connection failure
   * is an error rather than a shrug; when it is not, they register as skipped so
   * the ordinary unit suite still runs without a database. What they never do is
   * pass without having touched one.
   */
  const configured = !!(process.env.DB_HOST && process.env.DB_DATABASE);

  beforeAll(async () => {
    if (!configured) {
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
    if (!configured) {
      return;
    }
    objectRepository = new ObjectRepository(db);
    transactionRepository = new TransactionRepository(db);
    service = new ObjectService(
      db,
      objectRepository,
      new MemberRepository(db),
      transactionRepository,
      new ObjectInstanceRepository(db),
      new MallRepository(db),
    );

    await cleanup();
    await db.knex('wallet').insert({ id: FIXTURE.walletId, balance: 0 });
    await db.knex('member').insert({
      id: FIXTURE.memberId,
      email: 'atomicity-fixture@example.test',
      password: 'x',
      username: 'atomicityFixture',
      wallet_id: FIXTURE.walletId,
    });
    await db.knex('object').insert([{
      id: FIXTURE.objectId,
      filename: 'fixture.wrl',
      member_id: FIXTURE.memberId,
      name: 'Atomicity Fixture',
      quantity: FIXTURE.quantity,
      price: FIXTURE.price,
      status: ObjectService.STATUS_PENDING,
      directory: 'atomicity-fixture',
    }, {
      id: FIXTURE.secondObjectId,
      filename: 'fixture-2.wrl',
      member_id: FIXTURE.memberId,
      name: 'Atomicity Fixture 2',
      quantity: FIXTURE.quantity,
      price: FIXTURE.price,
      status: ObjectService.STATUS_PENDING,
      directory: 'atomicity-fixture-2',
    }]);
  });

  afterEach(async () => {
    if (configured) {
      await cleanup();
    }
  });

  async function cleanup(): Promise<void> {
    await db.knex('mall_object')
      .whereIn('object_id', [FIXTURE.objectId, FIXTURE.secondObjectId]).del();
    await db.knex('transaction').where({ recipient_wallet_id: FIXTURE.walletId }).del();
    await db.knex('object').whereIn('id', [FIXTURE.objectId, FIXTURE.secondObjectId]).del();
    await db.knex('member').where({ id: FIXTURE.memberId }).del();
    await db.knex('wallet').where({ id: FIXTURE.walletId }).del();
  }

  async function state(): Promise<{ status: number; balance: number; refunds: number }> {
    const [object] = await db.knex('object').where({ id: FIXTURE.objectId });
    const [wallet] = await db.knex('wallet').where({ id: FIXTURE.walletId });
    const refunds = await db.knex('transaction')
      .where({ recipient_wallet_id: FIXTURE.walletId, reason: 'object-upload-refund' });
    return {
      status: object ? object.status : -1,
      balance: wallet ? Number(wallet.balance) : -1,
      refunds: refunds.length,
    };
  }

  /** Registers as a real test, or as a visible skip - never as a silent pass. */
  const dbTest = configured ? it : it.skip;

  dbTest('refunds once and marks the object rejected', async () => {
    const result = await service.rejectPendingObject(FIXTURE.objectId);

    expect(result.outcome).toBe(ObjectService.REJECT_REJECTED);
    expect(await state()).toEqual({
      status: ObjectService.STATUS_DELETED,
      balance: EXPECTED_REFUND,
      refunds: 1,
    });
  });

  dbTest('rolls the wallet credit back when the ledger insert fails', async () => {
    // Credits inside the caller's transaction and then fails, which is exactly
    // the shape of a ledger insert that violates a constraint.
    transactionRepository.createObjectUploadRefundTransaction = async (
      walletId: number, amount: number, trx?: Knex.Transaction,
    ): Promise<Transaction> => {
      const wallet = await trx('wallet').where({ id: walletId }).first();
      await trx('wallet').where({ id: walletId }).update({ balance: wallet.balance + amount });
      throw new Error('ledger insert failed');
    };

    await expect(service.rejectPendingObject(FIXTURE.objectId)).rejects.toThrow();

    expect(await state()).toEqual({
      status: ObjectService.STATUS_PENDING,
      balance: 0,
      refunds: 0,
    });
  });

  dbTest('rolls the refund back when the status update fails', async () => {
    objectRepository.update = async (): Promise<void> => {
      throw new Error('status update failed');
    };

    await expect(service.rejectPendingObject(FIXTURE.objectId)).rejects.toThrow();

    // The money must not move for an object that is still pending: a retry would
    // otherwise pay the uploader a second time.
    expect(await state()).toEqual({
      status: ObjectService.STATUS_PENDING,
      balance: 0,
      refunds: 0,
    });
  });

  dbTest('refunds exactly once across a rolled-back attempt and a retry', async () => {
    const realUpdate = objectRepository.update.bind(objectRepository);
    objectRepository.update = async (): Promise<void> => {
      throw new Error('status update failed');
    };

    await expect(service.rejectPendingObject(FIXTURE.objectId)).rejects.toThrow();

    objectRepository.update = realUpdate;
    const retry = await service.rejectPendingObject(FIXTURE.objectId);

    expect(retry.outcome).toBe(ObjectService.REJECT_REJECTED);
    expect(await state()).toEqual({
      status: ObjectService.STATUS_DELETED,
      balance: EXPECTED_REFUND,
      refunds: 1,
    });
  });

  dbTest('refuses an object that is already rejected, without paying again', async () => {
    await service.rejectPendingObject(FIXTURE.objectId);
    const before = await state();

    const second = await service.rejectPendingObject(FIXTURE.objectId);

    expect(second.outcome).toBe(ObjectService.REJECT_ALREADY_REJECTED);
    expect(await state()).toEqual(before);
  });

  dbTest('refuses an object that is not a pending submission', async () => {
    await db.knex('object')
      .where({ id: FIXTURE.objectId })
      .update({ status: ObjectService.STATUS_APPROVED });

    const result = await service.rejectPendingObject(FIXTURE.objectId);

    expect(result.outcome).toBe(ObjectService.REJECT_INVALID_STATE);
    expect(await state()).toEqual({
      status: ObjectService.STATUS_APPROVED,
      balance: 0,
      refunds: 0,
    });
  });

  dbTest('refuses an object id that does not exist', async () => {
    const result = await service.rejectPendingObject(FIXTURE.objectId + 12345);

    expect(result.outcome).toBe(ObjectService.REJECT_NOT_FOUND);
  });

  dbTest('credits both refunds when two objects of one uploader are rejected at once',
    async () => {
      // The object-row lock serialises rejections of the SAME object. Two
      // DIFFERENT objects of the same uploader are not serialised by it, so the
      // wallet credit itself has to be safe: a read-modify-write would let both
      // transactions read the same balance and the second would overwrite the
      // first, losing a refund that its ledger row says was paid.
      const [first, second] = await Promise.all([
        service.rejectPendingObject(FIXTURE.objectId),
        service.rejectPendingObject(FIXTURE.secondObjectId),
      ]);

      expect(first.outcome).toBe(ObjectService.REJECT_REJECTED);
      expect(second.outcome).toBe(ObjectService.REJECT_REJECTED);

      const [wallet] = await db.knex('wallet').where({ id: FIXTURE.walletId });
      const refunds = await db.knex('transaction')
        .where({ recipient_wallet_id: FIXTURE.walletId, reason: 'object-upload-refund' });

      expect(refunds.length).toBe(2);
      // The ledger and the balance must agree.
      expect(Number(wallet.balance)).toBe(EXPECTED_REFUND * 2);
    });

  dbTest('approves a pending object and places it in the Mall', async () => {
    const result = await service.approvePendingObject(FIXTURE.objectId);

    expect(result.outcome).toBe(ObjectService.REJECT_REJECTED);
    const [object] = await db.knex('object').where({ id: FIXTURE.objectId });
    expect(object.status).toBe(ObjectService.STATUS_APPROVED);
    // `addToMallObjects` used to be fired without being awaited, so the status
    // could commit before the object was placed at all.
    const placed = await db.knex('mall_object').where({ object_id: FIXTURE.objectId });
    expect(placed.length).toBe(1);
  });

  dbTest('refuses to approve an object that is not a pending submission', async () => {
    await db.knex('object')
      .where({ id: FIXTURE.objectId })
      .update({ status: ObjectService.STATUS_DELETED });

    const result = await service.approvePendingObject(FIXTURE.objectId);

    expect(result.outcome).toBe(ObjectService.REJECT_INVALID_STATE);
    const [object] = await db.knex('object').where({ id: FIXTURE.objectId });
    expect(object.status).toBe(ObjectService.STATUS_DELETED);
    expect(await db.knex('mall_object').where({ object_id: FIXTURE.objectId })).toEqual([]);
  });

  dbTest('places an object in the Mall exactly once when two approvals race', async () => {
    const results = await Promise.all([
      service.approvePendingObject(FIXTURE.objectId),
      service.approvePendingObject(FIXTURE.objectId),
    ]);

    const placed = await db.knex('mall_object').where({ object_id: FIXTURE.objectId });
    expect(placed.length).toBe(1);
    expect(results.filter(r => r.outcome === ObjectService.REJECT_REJECTED).length).toBe(1);
  });

  dbTest('reads the refund row back through the caller\'s own trx, not a pool connection',
    async () => {
      // `creditWallet` used to read the just-inserted row back through the
      // repository's own pool connection (`this.find()`) rather than the trx
      // that inserted it. Under REPEATABLE READ, a query on a different
      // connection opens its own snapshot and cannot see a row a still-open
      // transaction has not committed yet, so that lookup deterministically
      // returned undefined even though the insert had already succeeded --
      // reproduced directly against this database before writing the fix.
      // Calling the caller-supplied-trx path here, exactly as
      // `rejectPendingObject` does, and asserting on what it resolves to
      // *before* the transaction commits is what a mock cannot demonstrate:
      // the row's visibility is a property of MySQL's isolation level, not of
      // this repository's code shape.
      let resolvedInsideTrx: Transaction;
      await db.knex.transaction(async trx => {
        resolvedInsideTrx = await transactionRepository.createObjectUploadRefundTransaction(
          FIXTURE.walletId, EXPECTED_REFUND, trx,
        );
      });

      expect(resolvedInsideTrx).toBeDefined();
      expect(resolvedInsideTrx.reason).toBe('object-upload-refund');
      expect(Number(resolvedInsideTrx.amount)).toBe(EXPECTED_REFUND);
      expect(resolvedInsideTrx.recipient_wallet_id).toBe(FIXTURE.walletId);
    });

  dbTest('pays exactly one refund when two rejections race', async () => {
    // Both start against a pending object. Without the row lock both would read
    // STATUS_PENDING and both would credit the wallet.
    const [first, second] = await Promise.all([
      service.rejectPendingObject(FIXTURE.objectId),
      service.rejectPendingObject(FIXTURE.objectId),
    ]);

    const outcomes = [first.outcome, second.outcome].sort();
    expect(outcomes).toEqual([
      ObjectService.REJECT_ALREADY_REJECTED,
      ObjectService.REJECT_REJECTED,
    ].sort());

    expect(await state()).toEqual({
      status: ObjectService.STATUS_DELETED,
      balance: EXPECTED_REFUND,
      refunds: 1,
    });
  });
});
