import { Service } from 'typedi';

import {
  MallRepository,
  MemberRepository,
  ObjectInstanceRepository,
  ObjectRepository,
  PlaceRepository,
} from '../../repositories';
import {
  compareWorldInfo,
  CTR_VIEW_DEFINITIONS,
  ctrViewsFor,
  externalReferences,
  scanVrml,
  statusName,
  summariseNodeCounts,
  textureReferences,
} from '../../libs';
import { ObjectSourceService } from '../object-source/object-source.service';
import {
  ObjectViewRow,
  ObjectWithUsername,
} from '../../repositories/object/object.repository';
import { StoreRow } from '../../repositories/mall-object/mall-object.repository';
import { Member, Place } from '../../types/models';

/**
 * Streams CTR's authoritative Mall dataset as one deterministic JSON document.
 *
 * Two shape decisions are load-bearing:
 *
 * 1. The completion record is written LAST. Counts, per-object failures and the
 *    overall outcome are not known until the work is done, so putting them in a
 *    header streamed first would mean either guessing or lying. A consumer must
 *    check `result.status === 'complete'`; a stream that was cut off has no
 *    `result` at all and will not even parse, so a partial file can never be
 *    mistaken for a dataset.
 *
 * 2. `derived=0` touches the filesystem zero times. It is pure SQL, so a missing
 *    or corrupt upload cannot affect it and it stays fast over the whole
 *    catalogue.
 */

export const EXPORT_SCHEMA_VERSION = '2.0.0';
export const EXPORT_GENERATOR = 'ctr-mall-export/1.0.0';

/** Objects read per page while streaming. Bounds peak memory, not total output. */
export const PAGE_SIZE = 200;

/** Wall-clock budget for one export. Exceeding it truncates rather than hangs. */
export const MAX_DURATION_MS = 120000;

/** Backstop against an unbounded catalogue. Exceeding it truncates. */
export const MAX_OBJECTS = 50000;

export type ExportStatus = 'complete' | 'truncated' | 'failed';

export interface ExportWriter {
  write(chunk: string): Promise<void>;
  isClosed(): boolean;
}

/** Everything global the document needs, gathered before the body opens. */
export interface ExportPreflight {
  stores: Place[];
  viewRows: ObjectViewRow[];
  allCounts: { [objectId: string]: number };
  allStores: { [objectId: string]: StoreRow };
}

/**
 * The part of a Node response this writer touches.
 *
 * Narrower than `ServerResponse` on purpose: the specs drive it with a plain
 * EventEmitter, and naming exactly what is used keeps that honest.
 */
export interface ExportResponse {
  write(chunk: string): boolean;
  once(event: string, listener: () => void): unknown;
  removeListener(event: string, listener: () => void): unknown;
  writableEnded?: boolean;
  destroyed?: boolean;
}

/** Why a document stopped early, and where it got to. */
export interface ExportTruncation {
  reason: string;
  lastObjectId: number | null;
  limit?: number;
  limitMs?: number;
}

/** Per-object counters the derived pass keeps. */
export interface DerivedTally {
  attempted: number;
  succeeded: number;
  failed: number;
  failuresByReason: { [reason: string]: number };
}

/** A JSON object in the document whose keys are not read back. */
export type JsonObject = { [key: string]: unknown };

/**
 * One object's entry in the document.
 *
 * The fields the derived pass reads back are declared; the rest of the entry is
 * assembled dynamically and only ever serialised.
 */
export interface ExportObject extends JsonObject {
  id: number;
  name: string | null;
  creator: { memberId: number | null; username: string | null };
  price: number | null;
  limit: number | null;
  store: { id: number; name: string } | null;
}

/** What `buildObject` needs to know about a row beyond the row itself. */
export interface ExportObjectContext {
  member: Member | null;
  sold: number;
  store: StoreRow | null;
  includeDerived: boolean;
  derivedTally: DerivedTally;
  /**
   * This object's own preflight snapshot row: the status, quantity and limit
   * captured before streaming began. `status`, `statusName`, `quantity`,
   * `limit` and `ctrViews` are all built from this, not from the live row a
   * later page fetch returns, so a status change mid-export cannot make one
   * object's entry disagree with the document's own top-level `ctrViews` and
   * counts -- both of which are also built from the snapshot.
   */
  snapshot: ObjectViewRow;
}

/** What `buildResult` measures once the body is written. */
export interface ExportResultContext {
  status: ExportStatus;
  now: () => number;
  startedAt: number;
  startedIso: string;
  objectsWritten: number;
  viewRows: ObjectViewRow[];
  allCounts: { [objectId: string]: number };
  storesCount: number;
  truncation: ExportTruncation | null;
  derivedTally: DerivedTally;
  includeDerived: boolean;
}

export interface ExportOptions {
  includeDerived: boolean;
  /** Injected so specs can drive the clock rather than wait on it. */
  now?: () => number;
  /**
   * When the export's wall-clock budget actually began.
   *
   * `preflight()` runs before this method is called, and it is not free: an
   * expensive preflight must count against `MAX_DURATION_MS` too, or the
   * advertised budget only bounds the streaming half of the work. The
   * controller captures this before calling `preflight()` and passes it
   * through unchanged; defaulting to `now()` here only covers callers (and
   * specs) that do not care about preflight's own cost.
   */
  startedAt?: number;
}

/**
 * Wraps an Express response so writes respect Node's backpressure signal.
 *
 * `response.write` returning false means the outbound buffer is full; ignoring
 * it lets a slow client drive the process's memory up while the export keeps
 * reading files as fast as it can.
 */
/**
 * Raised when the client goes away mid-export.
 *
 * Distinct from a server fault: it carries a stable public code and tells the
 * export loop to stop rather than keep reading files for a socket nobody is
 * listening to.
 */
export class ExportAborted extends Error {
  public readonly code: string;

  constructor(code = 'export_aborted') {
    super(code);
    this.name = 'ExportAborted';
    this.code = code;
  }
}

/**
 * Client-visible failure codes.
 *
 * Export payloads get downloaded and passed around, so they carry a stable code
 * rather than an exception message: raw messages here have been observed to
 * contain absolute filesystem paths.
 */
export const EXPORT_ERROR_CODES = {
  aborted: 'export_aborted',
  preflightFailed: 'export_preflight_failed',
  budgetExceeded: 'export_budget_exceeded',
  sourceUnreadable: 'source_unreadable',
  failed: 'export_failed',
};

/** Maps any thrown value onto a code that is safe to put in the document. */
export function publicErrorCode(error: unknown): string {
  if (error instanceof ExportAborted) {
    return error.code;
  }
  return EXPORT_ERROR_CODES.failed;
}

export function createResponseWriter(response: ExportResponse): ExportWriter {
  const isClosed = (): boolean => !!(response.writableEnded || response.destroyed);

  return {
    write(chunk: string): Promise<void> {
      if (isClosed()) {
        return Promise.reject(new ExportAborted());
      }
      if (response.write(chunk)) {
        return Promise.resolve();
      }
      // A destroyed or ended response never emits `drain`, so waiting on that
      // alone leaks this promise -- and with it the whole export handler -- for
      // every client that disconnects while the buffer is full.
      return new Promise<void>((resolve, reject) => {
        const cleanup = (): void => {
          response.removeListener('drain', onDrain);
          response.removeListener('close', onTerminate);
          response.removeListener('error', onTerminate);
        };
        const onDrain = (): void => {
          cleanup();
          resolve();
        };
        const onTerminate = (): void => {
          cleanup();
          reject(new ExportAborted());
        };
        response.once('drain', onDrain);
        response.once('close', onTerminate);
        response.once('error', onTerminate);
      });
    },
    isClosed,
  };
}

/**
 * Download name for one export.
 *
 * Colons are legal in a URL but not in a Windows filename, so the ISO time is
 * emitted without them. UTC throughout -- this stamps when the download was
 * made, which is a separate question from how the database's own timestamps
 * should be read.
 */
export function exportFilename(at: Date): string {
  const stamp = at.toISOString().split('.')[0].replace(/:/g, '');
  return `ctr-mall-export-${stamp}Z.json`;
}

/** One level of indentation in the streamed document. */
const INDENT = '  ';

/**
 * Indents an already-serialised JSON value so it can be streamed into a
 * pretty-printed document without ever holding the whole document in memory.
 *
 * Only the value's own continuation lines are padded; its first line is left
 * bare because the caller has already written the key and the space after it.
 * Every value passed here is bounded -- one object entry, one store list, one
 * result record -- so this never sees the document as a whole and the export's
 * memory profile is unchanged.
 */
export function indentJson(value: unknown, depth: number): string {
  const serialised = JSON.stringify(value, null, 2);
  if (serialised === undefined) {
    return 'null';
  }
  if (depth === 0) {
    return serialised;
  }
  return serialised.split('\n').join(`\n${INDENT.repeat(depth)}`);
}

function assetUrl(directory: string | null, filename: string | null): string | null {
  if (!directory || !filename) {
    return null;
  }
  return `/assets/object/${directory}/${filename}`;
}

@Service()
export class MallExportService {
  constructor(
    private objectRepository: ObjectRepository,
    private objectInstanceRepository: ObjectInstanceRepository,
    private mallRepository: MallRepository,
    private memberRepository: MemberRepository,
    private placeRepository: PlaceRepository,
    private objectSourceService: ObjectSourceService,
  ) {}

  /**
   * Every global query the document depends on, run before a byte is written.
   *
   * Keeping these ahead of the body is what lets a failure here surface as an
   * ordinary HTTP error. Once the response has started, the only options left
   * are a document that records its own failure or a truncated stream.
   */
  public async preflight(): Promise<ExportPreflight> {
    const stores = await this.placeRepository.findAllStores('name');
    const viewRows = await this.objectRepository.findViewRows();
    // Scoped to the pending ids this export actually covers -- the export is
    // pending-only, so scanning every object instance or every Mall placement
    // in the catalogue would make preflight scale with the whole catalogue
    // instead of with the queue this document is about.
    const pendingIds = viewRows.map(row => row.id);
    const allCounts = await this.objectInstanceRepository.countByObjectIds(pendingIds);
    const allStores = await this.mallRepository.getStoresByObjectIds(pendingIds);
    return { stores, viewRows, allCounts, allStores };
  }

  public async export(
    writer: ExportWriter,
    options: ExportOptions,
    preflight: ExportPreflight,
  ): Promise<ExportStatus> {
    const now = options.now || (() => Date.now());
    const startedAt = options.startedAt ?? now();
    const startedIso = new Date(startedAt).toISOString();

    const { stores, viewRows, allCounts, allStores } = preflight;

    let status: ExportStatus = 'complete';
    let truncation: ExportTruncation | null = null;
    let objectsWritten = 0;
    let bodyStarted = false;
    let objectsOpened = false;
    const derivedTally = {
      attempted: 0,
      succeeded: 0,
      failed: 0,
      failuresByReason: {} as { [reason: string]: number },
    };

    try {
      await writer.write(
        `{\n${INDENT}"schema": ${indentJson(this.buildSchema(startedIso, options), 1)}`,
      );
      bodyStarted = true;

      await writer.write(`,\n${INDENT}"stores": ${indentJson(stores.map((store: Place) => ({
        id: store.id,
        name: store.name,
        slug: store.slug,
        status: store.status,
      })), 1)}`);

      await writer.write(
        `,\n${INDENT}"ctrViews": ${indentJson(this.buildViews(viewRows, allCounts), 1)}`,
      );

      await writer.write(`,\n${INDENT}"objects": [`);
      objectsOpened = true;

      // The identity set this export commits to is fixed here, from the
      // preflight snapshot -- not re-queried per page. Staff approving or
      // rejecting an object mid-export changes what that id's row looks like,
      // never which ids this export visits or how many pages remain.
      const pendingIds = viewRows.map(row => row.id);
      const snapshotById = new Map(viewRows.map(row => [row.id, row]));
      let chunkStart = 0;
      let first = true;
      let lastObjectId: number | null = null;
      let missingSnapshotRows = 0;

      for (;;) {
        if (writer.isClosed()) {
          status = 'failed';
          truncation = { reason: 'client_disconnected', lastObjectId: null };
          break;
        }
        if (now() - startedAt > MAX_DURATION_MS) {
          status = 'truncated';
          truncation = {
            reason: 'time_budget',
            limitMs: MAX_DURATION_MS,
            lastObjectId: null,
          };
          break;
        }
        if (chunkStart >= pendingIds.length) {
          break;
        }

        // Checked only once a further page has actually been read, so a
        // catalogue of exactly MAX_OBJECTS reports complete: nothing was left
        // out, and the cap is a limit on what is omitted, not on what is sent.
        if (objectsWritten >= MAX_OBJECTS) {
          status = 'truncated';
          truncation = { reason: 'object_cap', limit: MAX_OBJECTS, lastObjectId: null };
          break;
        }

        const idsPage = pendingIds.slice(chunkStart, chunkStart + PAGE_SIZE);
        chunkStart += PAGE_SIZE;
        const page = await this.objectRepository.findRowsByIds(idsPage);
        missingSnapshotRows += idsPage.length - page.length;

        const members = await this.memberRepository.findByIds(
          page.map(row => row.member_id).filter((id: number) => !!id),
        );

        for (const row of page) {
          // Checked per row, not only per page. In derived mode each object is
          // read, decompressed, hashed and scanned, so a page-granular check
          // could run 200 of those after the deadline had already passed and
          // overshoot the advertised cap by minutes.
          if (now() - startedAt > MAX_DURATION_MS) {
            status = 'truncated';
            truncation = {
              reason: 'time_budget',
              limitMs: MAX_DURATION_MS,
              lastObjectId: null,
            };
            break;
          }

          const entry = await this.buildObject(row, {
            sold: allCounts[row.id] || 0,
            store: allStores[row.id] || null,
            member: row.member_id ? members[row.member_id] : null,
            includeDerived: options.includeDerived,
            derivedTally,
            // Always present: `row` came from a page fetched by an id drawn
            // from `pendingIds`, and `pendingIds` is exactly `viewRows`' ids.
            snapshot: snapshotById.get(row.id),
          });
          await writer.write(
            `${first ? '' : ','}\n${INDENT.repeat(2)}${indentJson(entry, 2)}`,
          );
          first = false;
          objectsWritten += 1;
          lastObjectId = row.id;
        }

        if (truncation) {
          break;
        }
      }

      // A row from the preflight snapshot that no longer comes back by id is
      // the one case none of the loop's own break conditions catch: nothing
      // client-visible went wrong, but a captured identity was silently
      // dropped, so `complete` would be a lie. This never happens in practice
      // today -- Mall moderation only ever updates `object.status`, it never
      // deletes the row -- but the check is what makes that an observed fact
      // rather than an assumption the export quietly depends on.
      if (!truncation && missingSnapshotRows > 0) {
        status = 'truncated';
        truncation = { reason: 'snapshot_rows_missing', lastObjectId };
      }

      // Recorded once, here. Every branch that sets `truncation` above breaks
      // out of the loop immediately, so the same assignment written inside the
      // loop could never run -- it reported the object count instead of an id.
      if (truncation && truncation.lastObjectId === null) {
        truncation.lastObjectId = lastObjectId;
      }

      // `[]` when nothing was written, rather than a bracket pair with a blank
      // line between them.
      await writer.write(first ? ']' : `\n${INDENT}]`);
      await writer.write(`,\n${INDENT}"result": ${indentJson(this.buildResult({
        status,
        truncation,
        startedIso,
        startedAt,
        now,
        objectsWritten,
        storesCount: stores.length,
        viewRows,
        allCounts,
        includeDerived: options.includeDerived,
        derivedTally,
      }), 1)}\n}\n`);
    } catch (error) {
      status = 'failed';

      if (!bodyStarted) {
        // Nothing reached the client, so there is no partial document to close
        // and no way to make one parse. Let the controller answer instead.
        throw error;
      }

      // The document is already partially written, so the only honest thing left
      // is to close it with a failed result rather than pretend it succeeded.
      // `objects` may not have been opened yet, in which case an empty array is
      // what keeps the document parseable.
      try {
        const tail = objectsOpened
          ? (objectsWritten === 0 ? ']' : `\n${INDENT}]`)
          : `,\n${INDENT}"objects": []`;
        await writer.write(`${tail},\n${INDENT}"result": ${indentJson({
          status: 'failed',
          reason: publicErrorCode(error),
          finishedAt: new Date(now()).toISOString(),
          objectsWritten,
        }, 1)}\n}\n`);
      } catch (writeError) {
        // Nothing further can be reported to a broken stream.
      }
    }

    return status;
  }

  private buildSchema(startedIso: string, options: ExportOptions): JsonObject {
    return {
      schemaVersion: EXPORT_SCHEMA_VERSION,
      generator: EXPORT_GENERATOR,
      startedAt: startedIso,
      includesDerived: options.includeDerived,
      scope: {
        objects: 'pending',
        note: 'Objects awaiting Mall review (CTR status 2) only. Stocked, warehoused, '
          + 'sold-out and removed objects are deliberately absent: this document is the '
          + 'submission queue the Mall Checker publishes, not the CTR catalogue. '
          + '`stores` remains the full Mall store list, as reference data a consumer '
          + 'needs to render a store name it may meet later.',
      },
      timestamps: {
        source: 'MySQL TIMESTAMP columns via the mysql driver',
        connectionTimezoneOption: 'unset (driver default "local")',
        normalized: false,
        note: 'Emitted exactly as the CTR API already emits them, and NOT relabelled as '
          + 'UTC. The value depends on the API process timezone, which CTR does not '
          + 'currently pin. See the timezone follow-up.',
      },
      fieldClassification: {
        db: [
          'id', 'assetDirectory', 'name', 'creator.memberId', 'price', 'quantity', 'limit',
          'status', 'store', 'placement', 'createdAt', 'updatedAt', 'mallExpiration',
          'description', 'assets.*.filename',
        ],
        count: ['sold'],
        asset: ['derived.wrl.storedBytes', 'derived.wrl.decodedBytes', 'derived.*.sha256'],
        derived: [
          'statusName', 'ctrViews', 'derived.vrmlHeader', 'derived.worldInfo',
          'derived.interpreted', 'derived.comparisons', 'derived.nodeCounts',
          'derived.textureReferences', 'derived.externalReferences', 'derived.viewpoints',
          'derived.warnings',
        ],
        absent: [
          'Mall Object Excellence / awards', 'reviewer or checked-by attribution',
          'category or object type', 'rejection reason', 'editorial catalog copy',
        ],
      },
    };
  }

  /**
   * The staff panel's six views as independent id lists.
   *
   * They overlap on purpose - a sold-out object is in both `stocked` and
   * `outOfStock` - so they are never collapsed into a single status label.
   */
  private buildViews(
    viewRows: ObjectViewRow[],
    counts: { [id: number]: number },
  ): JsonObject {
    const views: JsonObject = {
      _definitions: CTR_VIEW_DEFINITIONS,
      _note: 'Current CTR staff-panel view memberships, derived rather than stored. '
        + 'Scoped to the objects in this document, which is pending-only -- so `pending` '
        + 'lists every exported object and the other five views are empty by '
        + 'construction rather than by accident. They are kept so a consumer never has '
        + 'to infer membership from `status`, and so the shape does not change if the '
        + 'export scope is ever widened again.',
      pending: [],
      warehouse: [],
      stocked: [],
      outOfStock: [],
      removed: [],
      inactive: [],
    };

    viewRows.forEach(row => {
      const membership = ctrViewsFor({
        status: row.status,
        sold: counts[row.id] || 0,
        quantity: row.quantity,
        limit: row.limit === undefined ? null : row.limit,
      });
      Object.keys(membership).forEach(view => {
        if (membership[view as keyof typeof membership]) {
          (views[view] as number[]).push(row.id);
        }
      });
    });

    return views;
  }

  private async buildObject(
    row: ObjectWithUsername,
    context: ExportObjectContext,
  ): Promise<ExportObject> {
    // Snapshot-sourced, not row-sourced: this is what the document's own
    // schema.scope, top-level ctrViews and counts already describe this
    // object as, so a status change between preflight and this page's fetch
    // must not make this entry disagree with them.
    const { snapshot } = context;
    const limit = snapshot.limit === undefined ? null : snapshot.limit;
    const entry: ExportObject = {
      id: row.id,
      assetDirectory: row.directory ?? null,
      name: row.name ?? null,
      creator: {
        memberId: row.member_id ?? null,
        username: context.member ? context.member.username : null,
      },
      price: row.price ?? null,
      quantity: snapshot.quantity,
      limit,
      sold: context.sold,
      status: snapshot.status,
      statusName: statusName(snapshot.status),
      store: context.store ? { id: context.store.id, name: context.store.name } : null,
      // `position`/`rotation` are columns of `mall_object`, not `object`, so they
      // arrive with the store rather than on the object row.
      placement: context.store
        ? {
          position: this.parseJson(context.store.mall_position),
          rotation: this.parseJson(context.store.mall_rotation),
        }
        : null,
      ctrViews: ctrViewsFor({
        status: snapshot.status,
        sold: context.sold,
        quantity: snapshot.quantity,
        limit,
      }),
      createdAt: row.created_at ?? null,
      updatedAt: row.updated_at ?? null,
      mallExpiration: row.mall_expiration ?? null,
      description: row.description ?? null,
      assets: {
        thumbnail: {
          filename: row.image ?? null,
          url: assetUrl(row.directory, row.image),
        },
        wrl: {
          filename: row.filename ?? null,
          url: assetUrl(row.directory, row.filename),
        },
        texture: row.texture
          ? { filename: row.texture, url: assetUrl(row.directory, row.texture) }
          : null,
      },
    };

    if (context.includeDerived) {
      entry.derived = await this.buildDerived(row, context.derivedTally, entry);
    }

    return entry;
  }

  private async buildDerived(
    row: ObjectWithUsername,
    tally: DerivedTally,
    entry: ExportObject,
  ): Promise<JsonObject> {
    tally.attempted += 1;

    const source = await this.objectSourceService.readSource({
      directory: row.directory,
      filename: row.filename,
    });

    const derived: JsonObject = {
      wrl: {
        storedBytes: source.storedBytes,
        encoding: source.encoding,
        decodedBytes: source.decodedBytes,
        sha256: source.sha256,
      },
      thumbnail: null,
      texture: null,
      vrmlHeader: null,
      worldInfo: null,
      interpreted: null,
      comparisons: null,
      nodeCounts: null,
      textureReferences: null,
      externalReferences: null,
      viewpoints: null,
      warnings: [],
      sourceError: source.error,
      parseError: null,
    };

    if (row.image) {
      const thumbnail = await this.objectSourceService.readAssetMetadata({
        directory: row.directory,
        filename: row.image,
      });
      derived.thumbnail = { bytes: thumbnail.bytes, sha256: thumbnail.sha256,
        error: thumbnail.error };
    }
    if (row.texture) {
      const texture = await this.objectSourceService.readAssetMetadata({
        directory: row.directory,
        filename: row.texture,
      });
      derived.texture = { bytes: texture.bytes, sha256: texture.sha256, error: texture.error };
    }

    if (source.error !== null || source.text === null) {
      tally.failed += 1;
      const reason = source.error || 'unreadable';
      tally.failuresByReason[reason] = (tally.failuresByReason[reason] || 0) + 1;
      return derived;
    }

    try {
      const scan = scanVrml(source.text);
      const comparison = compareWorldInfo(scan, {
        name: entry.name,
        creatorUsername: entry.creator.username,
        price: entry.price,
        limit: entry.limit,
        storeName: entry.store ? entry.store.name : null,
      });

      derived.vrmlHeader = scan.header;
      derived.worldInfo = scan.worldInfo;
      derived.interpreted = comparison.interpreted;
      derived.comparisons = comparison.comparisons;
      derived.nodeCounts = summariseNodeCounts(scan);
      derived.textureReferences = textureReferences(scan);
      derived.externalReferences = externalReferences(scan);
      derived.viewpoints = scan.viewpoints;
      derived.warnings = scan.warnings;
      tally.succeeded += 1;
    } catch (error) {
      derived.parseError = EXPORT_ERROR_CODES.sourceUnreadable;
      tally.failed += 1;
      tally.failuresByReason.parse_error = (tally.failuresByReason.parse_error || 0) + 1;
    }

    return derived;
  }

  /** Written last, so every number in it is measured rather than predicted. */
  private buildResult(context: ExportResultContext): JsonObject {
    const byStatus: { [status: string]: number } = {};
    const viewSizes: { [view: string]: number } = {
      pending: 0, warehouse: 0, stocked: 0, outOfStock: 0, removed: 0, inactive: 0,
    };

    context.viewRows.forEach((row: ObjectViewRow) => {
      byStatus[String(row.status)] = (byStatus[String(row.status)] || 0) + 1;
      const membership = ctrViewsFor({
        status: row.status,
        sold: context.allCounts[row.id] || 0,
        quantity: row.quantity,
        limit: row.limit === undefined ? null : row.limit,
      });
      Object.keys(viewSizes).forEach(view => {
        if (membership[view as keyof typeof membership]) {
          viewSizes[view] += 1;
        }
      });
    });

    const result: JsonObject = {
      status: context.status,
      finishedAt: new Date(context.now()).toISOString(),
      durationMs: context.now() - context.startedAt,
      objectsWritten: context.objectsWritten,
      counts: {
        _takenAt: context.startedIso,
        _definitions: {
          stores: 'place WHERE type = \'shop\' AND status = 1',
          objects: 'COUNT(object) WHERE object.status = 2',
          byStatus: 'COUNT(object) WHERE object.status = 2 GROUP BY object.status',
          ctrViewSizes: 'length of each ctrViews list; predicates in ctrViews._definitions',
        },
        stores: context.storesCount,
        objects: context.viewRows.length,
        byStatus,
        ctrViewSizes: viewSizes,
      },
      truncation: context.truncation,
    };

    if (context.includeDerived) {
      result.derived = context.derivedTally;
    }

    return result;
  }

  private parseJson(value: unknown): unknown {
    if (typeof value !== 'string' || value === '') {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }
}
