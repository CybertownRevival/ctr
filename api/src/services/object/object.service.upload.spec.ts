import dotenv from 'dotenv';

// `knexfile` reads `../.env`, which resolves correctly for the running API but
// not for jest, whose cwd is `api/`.
dotenv.config();

import fs from 'fs';
import os from 'os';
import path from 'path';

import { Db } from '../../db/db.class';
import { ObjectRepository } from '../../repositories/object/object.repository';
import {
  ObjectService,
  safeUploadBasename,
  resolveWithinUploadPath,
} from './object.service';

/** A `Db`-shaped stub; `ObjectService`'s upload path never touches it directly. */
const fakeDb = {} as unknown as Db;

/** A file as `express-fileupload` hands one to a controller: name plus a movable Promise. */
interface FakeUploadedFile {
  name: string;
  mv: (destination: string) => Promise<void>;
}

function fakeFile(name: string, mv: (destination: string) => Promise<void>): FakeUploadedFile {
  return { name, mv };
}

describe('ObjectService upload completion', () => {
  let tempAssetsDir: string;
  const previousAssetsDir = process.env.ASSETS_DIR;

  beforeEach(() => {
    tempAssetsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctr-object-upload-'));
    // `uploadObjectFiles` only creates the uuid leaf; `ASSETS_DIR/object`
    // itself is provisioned once at deploy time in the real environment.
    fs.mkdirSync(path.join(tempAssetsDir, 'object'));
    process.env.ASSETS_DIR = tempAssetsDir;
  });

  afterEach(() => {
    process.env.ASSETS_DIR = previousAssetsDir;
    fs.rmSync(tempAssetsDir, { recursive: true, force: true });
  });

  /** A repository stub whose `create` resolves/rejects on command. */
  function buildService(objectRepositoryCreate: ObjectRepository['create']) {
    const objectRepository = { create: objectRepositoryCreate } as unknown as ObjectRepository;
    return new ObjectService(fakeDb, objectRepository, null, null, null, null);
  }

  it('does not resolve create() until a delayed wrl move finishes', async () => {
    let mvResolve: () => void;
    const mvPromise = new Promise<void>((resolve) => { mvResolve = resolve; });
    const wrlFile = fakeFile('object.wrl', async () => mvPromise);
    const imageFile = fakeFile('thumb.jpg', async () => undefined);
    const service = buildService(async () => 1);

    let resolved = false;
    const createPromise = service.create(wrlFile, imageFile, null, 'Name', 1, 10, 5)
      .then((id) => { resolved = true; return id; });

    // Give any wrongly-unawaited microtasks a chance to resolve create() early.
    await new Promise((r) => setImmediate(r));
    expect(resolved).toBe(false);

    mvResolve();
    await createPromise;
    expect(resolved).toBe(true);
  });

  it('awaits the wrl move, the image move, and the optional texture move', async () => {
    const calls: string[] = [];
    const wrlFile = fakeFile('object.wrl', async () => { calls.push('wrl'); });
    const imageFile = fakeFile('thumb.jpg', async () => { calls.push('image'); });
    const textureFile = fakeFile('wood.jpg', async () => { calls.push('texture'); });
    const service = buildService(async () => 1);

    await service.create(wrlFile, imageFile, textureFile, 'Name', 1, 10, 5);

    expect(calls).toEqual(['wrl', 'image', 'texture']);
  });

  it('rejects the upload when a move rejects, and cleans up the directory', async () => {
    const wrlFile = fakeFile('object.wrl', async () => { throw new Error('disk full'); });
    const imageFile = fakeFile('thumb.jpg', async () => undefined);
    const service = buildService(async () => 1);

    await expect(
      service.create(wrlFile, imageFile, null, 'Name', 1, 10, 5),
    ).rejects.toThrow('disk full');

    // The uuid directory this attempt created must not survive a failed move.
    const remaining = fs.readdirSync(path.join(tempAssetsDir, 'object'));
    expect(remaining).toEqual([]);
  });

  it('awaits objectRepository.create and propagates its rejection', async () => {
    const wrlFile = fakeFile('object.wrl', async () => undefined);
    const imageFile = fakeFile('thumb.jpg', async () => undefined);
    let createCalled = false;
    const service = buildService(async () => {
      createCalled = true;
      throw new Error('duplicate key');
    });

    await expect(
      service.create(wrlFile, imageFile, null, 'Name', 1, 10, 5),
    ).rejects.toThrow('duplicate key');
    expect(createCalled).toBe(true);

    // Files wrote successfully but the row never will -- the directory must
    // not be left behind under a uuid nothing will ever reference.
    const remaining = fs.readdirSync(path.join(tempAssetsDir, 'object'));
    expect(remaining).toEqual([]);
  });

  it('resolves create() only after objectRepository.create resolves, not before', async () => {
    const wrlFile = fakeFile('object.wrl', async () => undefined);
    const imageFile = fakeFile('thumb.jpg', async () => undefined);
    let dbResolve: (id: number) => void;
    const dbPromise = new Promise<number>((resolve) => { dbResolve = resolve; });
    const service = buildService(() => dbPromise);

    let resolved = false;
    const createPromise = service.create(wrlFile, imageFile, null, 'Name', 1, 10, 5)
      .then((id) => { resolved = true; return id; });

    await new Promise((r) => setImmediate(r));
    // This is the property the controller's fee-charging step depends on:
    // it awaits `create()` and only then charges the upload fee, so
    // `create()` resolving early would let the fee be charged for a row
    // that does not exist yet.
    expect(resolved).toBe(false);

    dbResolve(42);
    expect(await createPromise).toBe(42);
    expect(resolved).toBe(true);
  });
});

describe('ObjectService upload filename safety', () => {
  describe('safeUploadBasename', () => {
    it('keeps an ordinary filename byte-for-byte', () => {
      expect(safeUploadBasename('wood.jpg')).toBe('wood.jpg');
    });

    it('reduces a relative traversal to its basename', () => {
      expect(safeUploadBasename('../wood.jpg')).toBe('wood.jpg');
    });

    it('reduces a deep relative traversal to its basename', () => {
      expect(safeUploadBasename('../../../../evil.js')).toBe('evil.js');
    });

    it('reduces a Windows-style traversal to its basename', () => {
      expect(safeUploadBasename('..\\evil.jpg')).toBe('evil.jpg');
    });

    it('reduces an absolute path to its basename', () => {
      expect(safeUploadBasename('/etc/passwd')).toBe('passwd');
    });

    it('rejects a name that is only traversal syntax', () => {
      expect(() => safeUploadBasename('../..')).toThrow();
      expect(() => safeUploadBasename('')).toThrow();
    });
  });

  describe('resolveWithinUploadPath', () => {
    let directory: string;

    beforeEach(() => {
      directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ctr-upload-path-'));
    });

    afterEach(() => {
      fs.rmSync(directory, { recursive: true, force: true });
    });

    it('resolves an ordinary filename inside the directory', () => {
      const resolved = resolveWithinUploadPath(directory, 'wood.jpg');
      expect(resolved).toBe(path.join(directory, 'wood.jpg'));
      expect(resolved.startsWith(path.resolve(directory) + path.sep)).toBe(true);
    });

    it('throws rather than resolve a path that escapes the directory', () => {
      expect(() => resolveWithinUploadPath(directory, '../evil.js')).toThrow();
      expect(() => resolveWithinUploadPath(directory, '../../evil.js')).toThrow();
    });
  });

  it('an end-to-end malicious texture name cannot land outside the object directory',
    async () => {
      const tempAssetsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctr-object-upload-e2e-'));
      fs.mkdirSync(path.join(tempAssetsDir, 'object'));
      const previousAssetsDir = process.env.ASSETS_DIR;
      process.env.ASSETS_DIR = tempAssetsDir;
      try {
        const mvCalls: string[] = [];
        const wrlFile = fakeFile('object.wrl', async () => undefined);
        const imageFile = fakeFile('thumb.jpg', async () => undefined);
        // A filename with no dot, so a naive `.split('.').pop()` extension
        // strategy would forward the whole traversal payload unchanged.
        const textureFile = fakeFile(
          '../../../../etc/passwd',
          async (destination: string) => { mvCalls.push(destination); },
        );
        const objectRepository = {
          create: async () => 1,
        } as unknown as ObjectRepository;
        const service = new ObjectService(
          fakeDb, objectRepository, null, null, null, null,
        );

        await service.create(wrlFile, imageFile, textureFile, 'Name', 1, 10, 5);

        // The move must have been attempted only inside this upload's own
        // object/<uuid> directory -- never anywhere under a path containing
        // `..`, and never outside tempAssetsDir/object at all.
        expect(mvCalls).toHaveLength(1);
        const [actualDestination] = mvCalls;
        const objectRoot = path.resolve(tempAssetsDir, 'object');
        expect(path.resolve(actualDestination).startsWith(objectRoot + path.sep)).toBe(true);
        expect(actualDestination).not.toContain('..');
      } finally {
        process.env.ASSETS_DIR = previousAssetsDir;
        fs.rmSync(tempAssetsDir, { recursive: true, force: true });
      }
    });
});
