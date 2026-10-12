import { EventEmitter } from 'events';
import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';
import { createSpyObj } from 'jest-createspyobj';

import {
  createResponseWriter,
  ExportAborted,
  exportFilename,
  ExportWriter,
  MallExportService,
  MAX_DURATION_MS,
  MAX_OBJECTS,
  PAGE_SIZE,
} from './mall-export.service';
import { ObjectSourceService } from '../object-source/object-source.service';
import {
  MallRepository,
  MemberRepository,
  ObjectInstanceRepository,
  ObjectRepository,
  PlaceRepository,
} from '../../repositories';

const VRML = `#VRML V2.0 utf8
WorldInfo {
  title "Pocket Moon Playset"
  info [ "Made By: BassMekanik" "Mall Price: 75 CC" "Limited To: UNLIMITED" ]
}
Shape { appearance Appearance { texture ImageTexture { url "moon.jpg" } } }
`;

/**
 * Objects chosen so the fixture exercises every branch that matters: a placed
 * object with a store and sales, an object with no creator, and one whose file
 * is missing from disk.
 *
 * All pending, because pending is all the export ever sees now.
 */
/** CTR status 2. Mirrors `PENDING_STATUS` in ObjectRepository. */
const PENDING_STATUS = 2;

/** One object row as the fixtures build them. */
type ExportObjectRow = typeof OBJECTS[number];

/** The parts of a per-object `derived` block these tests read. */
interface DerivedBlock {
  wrl: {
    storedBytes: number | null;
    decodedBytes: number | null;
    encoding: string | null;
    sha256: string | null;
  };
  worldInfo: unknown;
  nodeCounts: { [node: string]: number };
  comparisons: { field: string; verdict: string }[];
  sourceError?: string;
  parseError?: string;
}

/** One object entry, as far as these tests inspect it. */
interface ExportEntry {
  id: number;
  assetDirectory: string | null;
  name: string | null;
  status: number;
  statusName: string;
  quantity: number | null;
  limit: number | null;
  creator: { memberId: number | null; username: string | null };
  store: { id: number; name: string } | null;
  placement: { position: unknown; rotation: unknown } | null;
  ctrViews: {
    pending: boolean;
    warehouse: boolean;
    stocked: boolean;
    outOfStock: boolean;
    removed: boolean;
    inactive: boolean;
  };
  assets?: { [kind: string]: { filename: string; url: string } | null };
  derived?: DerivedBlock;
}

/** The completion record written last. */
interface ExportResultBlock {
  status: string;
  objectsWritten: number;
  truncation: {
    reason: string;
    lastObjectId: number | null;
    limit?: number;
    limitMs?: number;
  } | null;
  counts: {
    objects: number;
    stores: number;
    byStatus: { [status: string]: number };
    ctrViewSizes: { [view: string]: number };
    _definitions: { [key: string]: string };
    _takenAt: string;
  };
  derived: {
    attempted: number;
    succeeded: number;
    failed: number;
    failuresByReason: { [reason: string]: number };
  };
}

/** The whole exported document. */
interface ExportDocument {
  schema: {
    schemaVersion: string;
    generator: string;
    includesDerived: boolean;
    scope: { objects: string; note: string };
    timestamps: { normalized: boolean; note: string };
  };
  stores: { id: number; name: string; slug: string; status: number }[];
  ctrViews: {
    pending: number[];
    warehouse: number[];
    stocked: number[];
    outOfStock: number[];
    removed: number[];
    inactive: number[];
    _definitions: { [view: string]: string };
    _note: string;
  };
  objects: ExportEntry[];
  result: ExportResultBlock;
}

const OBJECTS = [
  {
    id: 10, directory: 'uuid-a', filename: 'a.wrl', image: 'a.jpg', texture: null,
    member_id: 100, name: 'Pocket Moon Playset', quantity: 25, limit: null, price: 75,
    status: 2, created_at: '2026-08-20T08:02:43.000Z', updated_at: '2026-08-20T08:02:43.000Z',
    mall_expiration: null, description: null,
  },
  {
    id: 11, directory: 'uuid-b', filename: 'b.wrl', image: 'b.jpg', texture: null,
    member_id: null, name: 'Orphan', quantity: 5, limit: null, price: 20,
    status: 2, created_at: '2026-08-21T09:00:00.000Z', updated_at: '2026-08-21T09:00:00.000Z',
    mall_expiration: null, description: null,
  },
  {
    id: 12, directory: 'uuid-c', filename: 'gone.wrl', image: 'c.jpg', texture: null,
    member_id: 100, name: 'Broken', quantity: 10, limit: null, price: 30,
    status: 2, created_at: '2026-08-22T09:00:00.000Z', updated_at: '2026-08-22T09:00:00.000Z',
    mall_expiration: null, description: null,
  },
];

const VIEW_ROWS = OBJECTS.map(object => ({
  id: object.id,
  status: object.status,
  quantity: object.quantity,
  limit: object.limit,
}));

/** Part-sold; a pending object is in the `pending` view whatever its sales. */
const COUNTS = { 10: 5, 12: 3 };

// Shaped exactly as `getAllStoresByObjectId` returns it: `place.*` plus the
// object id and the aliased placement columns from `mall_object`. Putting
// position/rotation on an `object.*` row instead would test a query that does
// not exist.
const STORES = {
  10: {
    id: 1205,
    name: 'Toy Store',
    object_id: 10,
    mall_position: '{"x":0,"y":1.75,"z":0}',
    mall_rotation: '{"x":0,"y":0,"z":0,"angle":0}',
  },
};

function collectingWriter(): ExportWriter & { body(): string } {
  const chunks: string[] = [];
  return {
    write(chunk: string) {
      chunks.push(chunk);
      return Promise.resolve();
    },
    isClosed() {
      return false;
    },
    body() {
      return chunks.join('');
    },
  };
}

describe('MallExportService', () => {
  let assetsDir: string;
  let objectRoot: string;
  let originalAssetsDir: string | undefined;
  let objectRepository: jest.Mocked<ObjectRepository>;
  let objectInstanceRepository: jest.Mocked<ObjectInstanceRepository>;
  let mallRepository: jest.Mocked<MallRepository>;
  let memberRepository: jest.Mocked<MemberRepository>;
  let placeRepository: jest.Mocked<PlaceRepository>;
  let sourceService: ObjectSourceService;
  let service: MallExportService;

  function writeAsset(directory: string, filename: string, contents: Buffer | string): void {
    const target = path.join(objectRoot, directory);
    fs.mkdirSync(target, { recursive: true });
    fs.writeFileSync(path.join(target, filename), contents);
  }

  /** The parsed document plus the raw text, so tests can assert on either. */
  interface ExportRun {
    status: string;
    raw: string;
    document: ExportDocument;
  }

  async function runExport(includeDerived = false, now?: () => number): Promise<ExportRun> {
    const writer = collectingWriter();
    const preflight = await service.preflight();
    const status = await service.export(writer, { includeDerived, now }, preflight);
    return { status, raw: writer.body(), document: JSON.parse(writer.body()) };
  }

  beforeEach(() => {
    originalAssetsDir = process.env.ASSETS_DIR;
    assetsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctr-export-'));
    objectRoot = path.join(assetsDir, 'object');
    fs.mkdirSync(objectRoot, { recursive: true });
    process.env.ASSETS_DIR = assetsDir;

    writeAsset('uuid-a', 'a.wrl', zlib.gzipSync(Buffer.from(VRML)));
    writeAsset('uuid-a', 'a.jpg', Buffer.alloc(16));
    writeAsset('uuid-a', 'moon.jpg', Buffer.alloc(16));
    writeAsset('uuid-b', 'b.wrl', VRML);
    writeAsset('uuid-b', 'b.jpg', Buffer.alloc(16));

    objectRepository = createSpyObj(ObjectRepository);
    objectInstanceRepository = createSpyObj(ObjectInstanceRepository);
    mallRepository = createSpyObj(MallRepository);
    memberRepository = createSpyObj(MemberRepository);
    placeRepository = createSpyObj(PlaceRepository);
    sourceService = new ObjectSourceService();

    // Both queries filter to pending in SQL, so the mocks filter too: a mock that
    // returned stocked rows would let a scope regression pass unnoticed.
    objectRepository.findViewRows.mockResolvedValue(
      VIEW_ROWS.filter(row => row.status === PENDING_STATUS) as never,
    );
    // Id-scoped, not status-scoped: this is what makes the query stable
    // against a status change on an already-captured id, exactly like the
    // real `WHERE id IN (...)` query.
    objectRepository.findRowsByIds.mockImplementation(
      (ids: number[]) =>
        Promise.resolve(
          OBJECTS.filter(object => ids.includes(object.id)),
        ) as never,
    );
    // Both queries filter to the ids handed in, so the mocks filter too: a
    // mock that ignored the argument would let a whole-catalogue scan
    // regression pass unnoticed.
    objectInstanceRepository.countByObjectIds.mockImplementation(
      (ids: number[]) => Promise.resolve(
        Object.fromEntries(
          Object.entries(COUNTS).filter(([id]) => ids.includes(Number(id))),
        ),
      ) as never,
    );
    mallRepository.getStoresByObjectIds.mockImplementation(
      (ids: number[]) => Promise.resolve(
        Object.fromEntries(
          Object.entries(STORES).filter(([id]) => ids.includes(Number(id))),
        ),
      ) as never,
    );
    memberRepository.findByIds.mockResolvedValue(
      { 100: { id: 100, username: 'BassMekanik' } } as never,
    );
    placeRepository.findAllStores.mockResolvedValue([
      { id: 1205, name: 'Toy Store', slug: 'toystore', status: 1, assets_dir: '/srv/secret' },
    ] as never);

    service = new MallExportService(
      objectRepository,
      objectInstanceRepository,
      mallRepository,
      memberRepository,
      placeRepository,
      sourceService,
    );
  });

  afterEach(() => {
    process.env.ASSETS_DIR = originalAssetsDir;
    fs.rmSync(assetsDir, { recursive: true, force: true });
  });

  describe('document shape', () => {
    it('is valid JSON with result written last', async () => {
      const { raw, document } = await runExport();
      const keys = Object.keys(document);

      expect(keys[keys.length - 1]).toBe('result');
      expect(raw.trimEnd().endsWith('}')).toBe(true);
      expect(raw.indexOf('"result"')).toBeGreaterThan(raw.indexOf('"objects"'));
    });

    it('reports complete only after the work is done', async () => {
      const { status, document } = await runExport();

      expect(status).toBe('complete');
      expect(document.result.status).toBe('complete');
      expect(document.result.objectsWritten).toBe(3);
    });

    it('cannot be mistaken for complete if the stream is cut short', async () => {
      const { raw } = await runExport();
      const truncated = raw.slice(0, Math.floor(raw.length * 0.8));

      expect(() => JSON.parse(truncated)).toThrow();
    });

    it('emits objects in ascending id order', async () => {
      const { document } = await runExport();

      expect(document.objects.map((object: ExportEntry) => object.id)).toEqual([10, 11, 12]);
    });

    it('names the schema version and generator', async () => {
      const { document } = await runExport();

      expect(document.schema.schemaVersion).toBe('2.0.0');
      expect(document.schema.generator).toMatch(/^ctr-mall-export\//);
    });
  });

  describe('ctrViews', () => {
    it('declares its pending-only scope in the schema', async () => {
      const { document } = await runExport();

      expect(document.schema.scope.objects).toBe('pending');
      expect(document.schema.scope.note).toMatch(/status 2/);
      // A consumer reading `stores` must not conclude the catalogue is here.
      expect(document.schema.scope.note).toMatch(/stores/);
    });

    it('lists every exported object under pending and nothing under the rest',
      async () => {
        const { document } = await runExport();

        expect(document.ctrViews.pending).toEqual([10, 11, 12]);
        // Empty by construction, not by accident: a pending object cannot be
        // stocked, warehoused or sold out. Keeping the keys means a consumer
        // never has to special-case their absence.
        ['stocked', 'warehouse', 'outOfStock', 'removed', 'inactive'].forEach(view => {
          expect(document.ctrViews[view]).toEqual([]);
        });
      });

    it('publishes the predicate behind every view', async () => {
      const { document } = await runExport();

      expect(document.ctrViews._definitions.outOfStock).toContain('object.status = 1');
      expect(document.ctrViews._note).toContain('pending-only');
    });

    it('matches the sizes reported in the trailing result', async () => {
      const { document } = await runExport();
      const sizes = document.result.counts.ctrViewSizes;

      Object.keys(sizes).forEach(view => {
        expect(document.ctrViews[view].length).toBe(sizes[view]);
      });
    });

    it('reports byStatus counts that match the repository rows', async () => {
      const { document } = await runExport();

      expect(document.result.counts.byStatus).toEqual({ '2': 3 });
      expect(document.result.counts.objects).toBe(3);
    });

    it('defines every aggregate it reports', async () => {
      const { document } = await runExport();

      expect(Object.keys(document.result.counts._definitions).sort())
        .toEqual(['byStatus', 'ctrViewSizes', 'objects', 'stores']);
    });

    it('states the pending-only predicate in its own count definitions', async () => {
      // `viewRows` is `findViewRows()`, which filters to status = 2, so `objects`
      // and `byStatus` are pending-only counts. Their machine-readable
      // definitions must say so, or a consumer following them would read a
      // pending count as a catalogue-wide total.
      const { document } = await runExport();

      expect(document.result.counts._definitions.objects).toContain('object.status = 2');
      expect(document.result.counts._definitions.byStatus).toContain('object.status = 2');
    });
  });

  describe('field discipline', () => {
    it('preserves a null creator instead of inventing "Deleted User"', async () => {
      const { document, raw } = await runExport();
      const orphan = document.objects.find((object: ExportEntry) => object.id === 11);

      expect(orphan.creator).toEqual({ memberId: null, username: null });
      expect(raw).not.toContain('Deleted User');
    });

    it('exports the raw limit and derives no unlimited flag', async () => {
      const { document } = await runExport();
      const object = document.objects[0];

      expect(object.limit).toBeNull();
      expect(object).not.toHaveProperty('unlimited');
    });

    it('does not synthesize a remaining count', async () => {
      const { document } = await runExport();

      expect(document.objects[0]).not.toHaveProperty('remaining');
    });

    it('calls the asset directory what it is, not a uuid', async () => {
      const { document } = await runExport();

      expect(document.objects[0].assetDirectory).toBe('uuid-a');
      expect(document.objects[0]).not.toHaveProperty('uuid');
    });

    it('does not attach an ambiguous object count to stores', async () => {
      const { document } = await runExport();

      expect(document.stores[0]).not.toHaveProperty('objectCount');
      expect(Object.keys(document.stores[0]).sort())
        .toEqual(['id', 'name', 'slug', 'status']);
    });

    it('states that timestamps are not normalized', async () => {
      const { document } = await runExport();

      expect(document.schema.timestamps.normalized).toBe(false);
      expect(document.schema.timestamps.note).toContain('NOT relabelled');
    });
  });

  describe('privacy', () => {
    it('leaks no filesystem paths or server internals', async () => {
      const { raw } = await runExport(true);

      expect(raw).not.toContain(assetsDir);
      expect(raw).not.toContain(os.tmpdir());
      expect(raw).not.toContain('/srv/secret');
      expect(raw).not.toMatch(/"password"|"email"|"token"|"wallet"/);
    });

    it('references assets by public url only', async () => {
      const { document } = await runExport();

      expect(document.objects[0].assets.wrl.url).toBe('/assets/object/uuid-a/a.wrl');
    });
  });

  describe('derived=0 is genuinely cheap', () => {
    it('omits every derived block', async () => {
      const { document } = await runExport(false);

      document.objects.forEach((object: ExportEntry) => {
        expect(object).not.toHaveProperty('derived');
      });
      expect(document.schema.includesDerived).toBe(false);
      expect(document.result).not.toHaveProperty('derived');
    });

    it('performs no filesystem access at all', async () => {
      const readSource = jest.spyOn(sourceService, 'readSource');
      const readAsset = jest.spyOn(sourceService, 'readAssetMetadata');

      await runExport(false);

      expect(readSource).not.toHaveBeenCalled();
      expect(readAsset).not.toHaveBeenCalled();
    });
  });

  describe('derived=1', () => {
    it('reports stored and decoded bytes separately, plus the encoding', async () => {
      const { document } = await runExport(true);
      const object = document.objects.find((entry: ExportEntry) => entry.id === 10);

      expect(object.derived.wrl.encoding).toBe('gzip');
      expect(object.derived.wrl.storedBytes).toBeLessThan(object.derived.wrl.decodedBytes);
      expect(object.derived.wrl.sha256).toMatch(/^[0-9a-f]{64}$/);
    });

    it('carries WorldInfo, node counts and comparisons', async () => {
      const { document } = await runExport(true);
      const object = document.objects.find((entry: ExportEntry) => entry.id === 10);

      expect(object.derived.worldInfo[0].title).toBe('Pocket Moon Playset');
      expect(object.derived.nodeCounts.ImageTexture).toBe(1);
      const priceComparison = object.derived.comparisons
        .find((c: { field: string; verdict: string }) => c.field === 'price');
      expect(priceComparison.verdict)
        .toBe('MATCH');
    });

    it('keeps a broken object in the export and records why it failed', async () => {
      const { document } = await runExport(true);
      const broken = document.objects.find((entry: ExportEntry) => entry.id === 12);

      expect(broken).toBeDefined();
      expect(broken.derived.sourceError).toBe('missing');
      expect(broken.derived.worldInfo).toBeNull();
      expect(document.result.derived.failed).toBe(1);
      expect(document.result.derived.failuresByReason.missing).toBe(1);
      expect(document.result.status).toBe('complete');
    });

    it('tallies attempts, successes and failures', async () => {
      const { document } = await runExport(true);

      expect(document.result.derived.attempted).toBe(3);
      expect(document.result.derived.succeeded).toBe(2);
      expect(document.result.derived.failed).toBe(1);
    });
  });

  describe('budgets', () => {
    it('reports truncation rather than silently returning a short dataset',
      async () => {
        // A clock that jumps past the budget as soon as the first page is done.
        let calls = 0;
        const now = () => {
          calls += 1;
          return calls > 2 ? MAX_DURATION_MS + 1000 : 0;
        };

        const { status, document } = await runExport(false, now);

        expect(status).toBe('truncated');
        expect(document.result.status).toBe('truncated');
        expect(document.result.truncation.reason).toBe('time_budget');
        expect(document.result.truncation.limitMs).toBe(MAX_DURATION_MS);
      });

    it('stops mid-page rather than finishing the page it is on', async () => {
      // The deadline falls after the first object of the first page. A
      // page-granular check would emit all three; a per-row check emits one.
      // In derived mode each of those objects is read, decompressed, hashed and
      // scanned, which is why finishing the page is not a rounding error.
      let calls = 0;
      const now = () => {
        calls += 1;
        return calls > 3 ? MAX_DURATION_MS + 1000 : 0;
      };

      const { document } = await runExport(false, now);

      expect(document.result.status).toBe('truncated');
      expect(document.result.truncation.reason).toBe('time_budget');
      expect(document.objects.length).toBeLessThan(OBJECTS.length);
      // Whatever it did emit is still a usable cursor.
      expect(document.result.truncation.lastObjectId)
        .toBe(document.objects[document.objects.length - 1].id);
    });

    it('stops reading when the client goes away', async () => {
      const writer: ExportWriter = {
        write: () => Promise.resolve(),
        isClosed: () => true,
      };

      const preflight = await service.preflight();
      const status = await service.export(writer, { includeDerived: false }, preflight);

      expect(status).toBe('failed');
      expect(objectRepository.findRowsByIds).not.toHaveBeenCalled();
    });
  });

  describe('pretty-printed output', () => {
    // Owner QA: the downloaded file was one enormous minified line and could
    // not realistically be read by eye. Indentation is presentation only --
    // every assertion here that pins the shape is paired with one proving the
    // parsed data did not change.
    it('indents the document with two spaces at every level', async () => {
      const { raw } = await runExport();

      expect(raw.startsWith('{\n  "schema": {\n')).toBe(true);
      expect(raw).toContain('\n  "stores": [');
      expect(raw).toContain('\n  "ctrViews": {');
      expect(raw).toContain('\n  "objects": [');
      expect(raw).toContain('\n  "result": {');
      expect(raw.endsWith('\n}\n')).toBe(true);
    });

    it('indents each object entry inside the objects array', async () => {
      const { raw } = await runExport();

      expect(raw).toContain('\n  "objects": [\n    {\n      "id":');
      expect(raw).toContain('\n    }\n  ],\n  "result": {');
    });

    it('never emits a minified run of the document', async () => {
      const { raw } = await runExport();

      // The old output had no newline at all between the opening brace and the
      // result record. Any line long enough to be a whole serialised object is
      // the regression this guards.
      const longest = raw.split('\n').reduce((max, line) => Math.max(max, line.length), 0);
      expect(longest).toBeLessThan(raw.length / 2);
    });

    it('parses to exactly the same data as the compact serialisation', async () => {
      const { raw, document } = await runExport(true);

      // Whitespace is not part of the contract: re-serialising the parsed
      // document compactly and parsing that again must be indistinguishable.
      expect(JSON.parse(JSON.stringify(document))).toEqual(document);
      expect(JSON.parse(raw)).toEqual(document);
      expect(document.result.status).toBe('complete');
      expect(document.objects.length).toBe(document.result.objectsWritten);
    });

    it('writes an empty objects array without a blank line in it', async () => {
      objectRepository.findViewRows.mockResolvedValue([]);
      objectRepository.findRowsByIds.mockResolvedValue([]);
      objectInstanceRepository.countByObjectIds.mockResolvedValue({});
      mallRepository.getStoresByObjectIds.mockResolvedValue({});

      const { raw, document } = await runExport();

      expect(raw).toContain('"objects": [],');
      expect(document.objects).toEqual([]);
      expect(document.result.status).toBe('complete');
      expect(document.result.objectsWritten).toBe(0);
    });

    it('still streams incrementally rather than buffering the document', async () => {
      // The point of the export is that it never holds the whole document in
      // memory. Indentation is applied per bounded value, so the number of
      // writes must still scale with the content, not collapse to one.
      const chunks: string[] = [];
      const writer: ExportWriter = {
        write(chunk: string) {
          chunks.push(chunk);
          return Promise.resolve();
        },
        isClosed() {
          return false;
        },
      };

      const preflight = await service.preflight();
      await service.export(writer, { includeDerived: false }, preflight);

      // schema, stores, ctrViews, objects-open, one per object, objects-close,
      // result. Never a single write carrying everything.
      expect(chunks.length).toBeGreaterThanOrEqual(OBJECTS.length + 6);
      const document = JSON.parse(chunks.join(''));
      expect(document.objects.length).toBe(OBJECTS.length);
    });
  });

  describe('export identity snapshot', () => {
    it('does not skip a later pending object when an earlier one is mutated mid-export',
      async () => {
        // Enough rows to span two pages, so the second page's fetch happens
        // only after the first page has already been written -- exactly where
        // a mutable `WHERE status = ... OFFSET ...` page would have shifted
        // under a concurrent status change on an earlier row.
        const template = OBJECTS[1];
        const count = PAGE_SIZE + 5;
        const rows: ExportObjectRow[] = new Array(count);
        for (let index = 0; index < count; index += 1) {
          rows[index] = { ...template, id: 2000 + index, name: `Snapshot ${index}` };
        }
        const byId = new Map(rows.map(row => [row.id, row]));

        objectRepository.findViewRows.mockResolvedValue(
          rows.map(row => (
            { id: row.id, status: row.status, quantity: row.quantity, limit: row.limit }
          )) as never,
        );

        let firstPageFetched = false;
        objectRepository.findRowsByIds.mockImplementation((ids: number[]) => {
          if (!firstPageFetched) {
            firstPageFetched = true;
          } else {
            // Staff approve the very first object in the snapshot between the
            // first and second page's fetches. A live `status = 2` OFFSET
            // query would now see one fewer pending row ahead of every later
            // id, shifting each of them one slot earlier and skipping the
            // last one.
            byId.get(rows[0].id).status = 1;
          }
          return Promise.resolve(ids.map(id => byId.get(id)).filter(Boolean)) as never;
        });

        const { document } = await runExport();

        const ids = document.objects.map((object: ExportEntry) => object.id);
        expect(ids).toEqual(rows.map(row => row.id));
        expect(ids).toContain(rows[rows.length - 1].id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(document.result.status).toBe('complete');
      });

    it('does not admit an object added to Pending after the snapshot was taken', async () => {
      const { document } = await runExport();

      // The fixture's `findViewRows` mock returns exactly ids [10, 11, 12];
      // nothing else may appear even though `findRowsByIds` would happily
      // return whatever ids it's asked for.
      expect(document.objects.map((object: ExportEntry) => object.id)).toEqual([10, 11, 12]);
    });

    it('reports truncated, not complete, when a captured id no longer resolves to a row',
      async () => {
        objectRepository.findRowsByIds.mockImplementation(
          (ids: number[]) =>
            Promise.resolve(
              OBJECTS.filter(object => ids.includes(object.id) && object.id !== 12),
            ) as never,
        );

        const { document } = await runExport();

        expect(document.result.status).toBe('truncated');
        expect(document.result.truncation.reason).toBe('snapshot_rows_missing');
      });

    it('serializes status, statusName, quantity, limit and ctrViews from the '
      + 'snapshot, not a later live read', async () => {
      // Object 10 is captured Pending (status 2) in `findViewRows`, but the
      // full-row fetch that happens later returns it already approved
      // (status 1) -- exactly what a concurrent Accept produces between
      // preflight and this page's fetch.
      objectRepository.findRowsByIds.mockImplementation(
        (ids: number[]) =>
          Promise.resolve(
            OBJECTS.filter(object => ids.includes(object.id))
              .map(object => (object.id === 10 ? { ...object, status: 1 } : object)),
          ) as never,
      );

      const { document } = await runExport();

      const entry = document.objects.find((object: ExportEntry) => object.id === 10);
      // Snapshot-sourced: still the Pending values `findViewRows` captured,
      // not the live "already approved" row the page fetch returned.
      expect(entry.status).toBe(PENDING_STATUS);
      expect(entry.statusName).not.toBe('accepted');
      expect(entry.ctrViews.pending).toBe(true);
      expect(entry.ctrViews.stocked).toBe(false);
      // The document's own top-level ctrViews and byStatus, also built from
      // the snapshot, must agree with what the entry itself claims.
      expect(document.ctrViews.pending).toContain(10);
      expect(document.result.counts.byStatus).toEqual({ '2': 3 });
    });
  });

  describe('MallExportService - placement is a mall_object fact', () => {
    it('emits the stored placement for a placed object', async () => {
      const { document } = await runExport();
      const placed = document.objects.find((entry: ExportEntry) => entry.id === 10);

      expect(placed.store).toEqual({ id: 1205, name: 'Toy Store' });
      expect(placed.placement).toEqual({
        position: { x: 0, y: 1.75, z: 0 },
        rotation: { x: 0, y: 0, z: 0, angle: 0 },
      });
    });

    it('emits null placement for an object that is in no store', async () => {
      const { document } = await runExport();
      const unplaced = document.objects.find((entry: ExportEntry) => entry.id === 11);

      expect(unplaced.store).toBeNull();
      expect(unplaced.placement).toBeNull();
    });

    it('emits exactly one row per object', async () => {
      // Placement is read from the keyed store map rather than joined onto the
      // page query, so a second mall_object row for one object cannot duplicate
      // an export entry.
      const { document } = await runExport();
      const ids = document.objects.map((entry: ExportEntry) => entry.id);

      expect(ids).toEqual(OBJECTS.map(object => object.id));
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  /**
   * The cap is the one place an export can quietly become a partial dataset, so
   * all three sides of the boundary are pinned. A catalogue of exactly
   * MAX_OBJECTS is complete -- nothing was left behind -- and reporting it as
   * truncated would send staff hunting for objects that do not exist.
   */
  describe('the MAX_OBJECTS boundary', () => {
    function catalogueOf(count: number): ExportObjectRow[] {
      const template = OBJECTS[1]; // no stores, no counts: the cheapest row to build
      const rows = new Array(count);
      for (let index = 0; index < count; index += 1) {
        rows[index] = { ...template, id: 1000 + index, name: `Object ${index}` };
      }
      return rows;
    }

    async function exportCatalogue(count: number): Promise<ExportRun> {
      const rows = catalogueOf(count);
      const byId = new Map(rows.map(row => [row.id, row]));
      objectRepository.findRowsByIds.mockImplementation(
        (ids: number[]) =>
          Promise.resolve(ids.map(id => byId.get(id)).filter(Boolean)) as never,
      );
      objectRepository.findViewRows.mockResolvedValue(
        rows.map(row => (
          { id: row.id, status: row.status, quantity: row.quantity, limit: row.limit }
        )) as never,
      );
      return runExport();
    }

    it('reports complete one object below the cap', async () => {
      const { document } = await exportCatalogue(MAX_OBJECTS - 1);
      expect(document.result.status).toBe('complete');
      expect(document.result.truncation).toBeNull();
      expect(document.objects.length).toBe(MAX_OBJECTS - 1);
    });

    it('reports complete at exactly the cap', async () => {
      const { document } = await exportCatalogue(MAX_OBJECTS);
      expect(document.result.status).toBe('complete');
      expect(document.result.truncation).toBeNull();
      expect(document.objects.length).toBe(MAX_OBJECTS);
    });

    it('reports truncated one object above the cap, with a usable cursor', async () => {
      const { document } = await exportCatalogue(MAX_OBJECTS + 1);
      expect(document.result.status).toBe('truncated');
      expect(document.result.truncation.reason).toBe('object_cap');
      expect(document.result.truncation.limit).toBe(MAX_OBJECTS);
      expect(document.objects.length).toBe(MAX_OBJECTS);
      // The id of the last object actually emitted, not a count of them.
      expect(document.result.truncation.lastObjectId)
        .toBe(document.objects[document.objects.length - 1].id);
    });
  });
});

describe('createResponseWriter', () => {
  /**
   * A real EventEmitter, because the bug this guards against is precisely that
   * the writer waited on an event a dead socket never emits. A hand-rolled stub
   * that only records `drain` handlers cannot express that.
   */
  class FakeResponse extends EventEmitter {
    public written: string[] = [];
    public writableEnded = false;
    public destroyed = false;
    private results: boolean[];

    constructor(writeResults: boolean[] = []) {
      super();
      this.results = writeResults;
    }

    public write(chunk: string): boolean {
      this.written.push(chunk);
      return this.results.length ? (this.results.shift() as boolean) : true;
    }

    /** Every listener the writer could have left behind. */
    public waiters(): number {
      return this.listenerCount('drain')
        + this.listenerCount('close')
        + this.listenerCount('error');
    }
  }

  it('resolves immediately when the socket accepts the write', async () => {
    const response = new FakeResponse([true]);

    await createResponseWriter(response).write('chunk');

    expect(response.written).toEqual(['chunk']);
    expect(response.waiters()).toBe(0);
  });

  it('continues once the socket drains', async () => {
    const response = new FakeResponse([false]);
    let settled = false;

    const pending = createResponseWriter(response).write('big chunk').then(() => {
      settled = true;
    });

    await Promise.resolve();
    expect(settled).toBe(false);
    expect(response.waiters()).toBe(3);

    response.emit('drain');
    await pending;

    expect(settled).toBe(true);
    expect(response.waiters()).toBe(0);
  });

  it('aborts when the client disconnects instead of draining', async () => {
    const response = new FakeResponse([false]);

    const pending = createResponseWriter(response).write('big chunk');
    await Promise.resolve();
    expect(response.waiters()).toBe(3);

    response.emit('close');

    await expect(pending).rejects.toBeInstanceOf(ExportAborted);
    expect(response.waiters()).toBe(0);
  });

  it('aborts when the socket errors instead of draining', async () => {
    const response = new FakeResponse([false]);

    const pending = createResponseWriter(response).write('big chunk');
    await Promise.resolve();

    response.emit('error', new Error('ECONNRESET'));

    await expect(pending).rejects.toBeInstanceOf(ExportAborted);
    expect(response.waiters()).toBe(0);
  });

  it('never leaves a write pending on a socket that will not drain', async () => {
    const response = new FakeResponse([false]);
    let settled = false;

    createResponseWriter(response).write('big chunk')
      .then(() => { settled = true; }, () => { settled = true; });

    response.emit('close');
    await new Promise(resolve => setImmediate(resolve));

    expect(settled).toBe(true);
  });

  it('refuses to write to an already destroyed response', async () => {
    const response = new FakeResponse([]);
    response.destroyed = true;

    await expect(createResponseWriter(response).write('chunk'))
      .rejects.toBeInstanceOf(ExportAborted);
    expect(response.written).toEqual([]);
  });

  it('reports a finished or destroyed response as closed', () => {
    const response = new FakeResponse([]);
    expect(createResponseWriter(response).isClosed()).toBe(false);

    response.destroyed = true;
    expect(createResponseWriter(response).isClosed()).toBe(true);
  });
});

describe('exportFilename', () => {
  it('stamps the download in UTC with no character illegal in a filename', () => {
    const name = exportFilename(new Date(Date.UTC(2026, 7, 23, 12, 19, 22, 500)));

    expect(name).toBe('ctr-mall-export-2026-08-23T121922Z.json');
    expect(name).not.toMatch(/[:\\/]/);
  });

});
