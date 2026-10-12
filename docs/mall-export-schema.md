# CTR Mall export schema

`GET /api/mall/export?derived=0|1`

One deterministic JSON document containing the Mall submission queue CTR is
authoritative for. Intended both for staff who want the data and for downstream
tooling such as the separate Cybertown Mall site's importer.

Requires Mall staff authorisation (`Admin`, `Mall Deputy` or `Mall Manager`) and
is strictly read-only.

- **Schema version:** `2.0.0`
- **Object scope:** **pending only** — see below.
- **Ordering:** objects ascend by `object.id`. The order is stable across runs.
- **Filename:** the server sends `Content-Disposition` with a UTC stamp precise
  to the second, e.g. `ctr-mall-export-2026-08-24T012138Z.json`, so two exports
  taken minutes apart are distinct files.

---

## Scope: pending objects only

**`objects` contains only objects awaiting Mall review (CTR `status = 2`).** This
document is the submission queue the Mall Checker publishes to the Mall's own
site. It is **not** a complete-Mall catalogue export: stocked, warehoused,
sold-out and removed objects are deliberately absent.

The document says so itself, in `schema.scope`:

```json
"scope": {
  "objects": "pending",
  "note": "Objects awaiting Mall review (CTR status 2) only. ..."
}
```

Two consequences worth stating plainly:

- **`stores` is still the full Mall store list**, kept as reference data so a
  consumer can render a store name it may meet later. Do not infer from it that
  the objects of those stores are present.
- **`derived=1` enriches the same object set as `derived=0`.** The mode changes
  how much is said about each object, never which objects appear.

Version `1.0.0` of this schema exported every object regardless of status. A
consumer written against it must check `schema.scope`.

---

## The one rule a consumer must follow

**Check `result.status === "complete"` before treating the document as data.**

The completion record is written at the *end* of the document, because counts,
per-object failures and the outcome are not known until the work is finished. A
run that was truncated says so; a stream that was cut off has no `result` at all
and will not parse. Anything other than `complete` is a diagnostic artefact.

```
{ "schema": {...},      <- static, known before any work
  "stores": [...],
  "ctrViews": {...},
  "objects": [ ... ],   <- streamed one at a time
  "result": {...} }     <- WRITTEN LAST: real counts, real errors, real status
```

---

## Field classification

Every field is one of:

| Class | Meaning |
| --- | --- |
| **DB** | An authoritative database column, verbatim. |
| **COUNT** | An authoritative count derived by query (`sold`). |
| **ASSET** | An authoritative fact about the stored file (size, encoding, hash). |
| **DERIVED** | A deterministic function of stored bytes or of DB fields. |

`schema.fieldClassification` carries the same mapping in machine-readable form.

---

## `schema`

| Field | Notes |
| --- | --- |
| `schemaVersion` | Bumped on any breaking change. |
| `generator` | `ctr-mall-export/<version>`. |
| `startedAt` | When the run began. Not an outcome. |
| `includesDerived` | Echo of `?derived=`. |
| `timestamps` | See below. |
| `fieldClassification` | DB / COUNT / ASSET / DERIVED / absent. |

### `schema.timestamps`

`normalized` is **`false`**, and timestamps are emitted exactly as the existing
CTR API emits them. They are **not** relabelled UTC and are **not** shifted.

CTR does not currently pin a timezone: `knexfile.ts` sets no `timezone` option, so
the MySQL driver defaults to `local` and builds dates using the API process's
zone. Measured behaviour for a value stored as `2026-08-20 08:02:43` in a UTC
MySQL:

```
API process TZ = UTC               ->  2026-08-20T08:02:43.000Z
API process TZ = America/New_York  ->  2026-08-20T12:02:43.000Z
```

Production runs the stock `node:14` image (UTC) against a UTC MySQL, so values are
correct there today - but by coincidence of two defaults rather than by design.
Pinning it is a CTR-wide change and is tracked separately; this export refuses to
paper over it.

---

## `stores`

`id`, `name`, `slug`, `status` - all **DB**, from
`place WHERE type = 'shop' AND status = 1`.

No object count is attached: "how many objects does this store have" is ambiguous
(stocked only? every status? counting `mall_object` rows or `object` rows?). Per
view counts live in `result.counts.ctrViewSizes` with explicit predicates.

---

## `ctrViews`

The Mall staff panel's six views, as independent id lists.

**These are current CTR view memberships, not stored states.** They are scoped to
the objects in this document, which is pending-only — so `pending` lists every
exported object and the other five are empty by construction rather than by
accident. The keys are kept so a consumer never has to special-case their absence
or infer membership from `status`.

The predicates below still describe CTR's real, overlapping view model — a
sold-out object is in `stocked` *and* `outOfStock` — which is why the lists are
never collapsed into a single status field. In a pending-only document that
overlap simply has nothing to act on.

`ctrViews._definitions` gives the predicate behind each list:

| View | Predicate |
| --- | --- |
| `pending` | `object.status = 2` |
| `warehouse` | `object.status = 3` |
| `stocked` | `object.status = 1` |
| `outOfStock` | `object.status = 1 AND sold = quantity AND (limit = quantity OR limit IS NULL)` |
| `removed` | `object.status = 0` |
| `inactive` | `object.status = 4` |

`outOfStock` reproduces the Out of Stock page exactly, **including** the fact that
an object whose limit is `0` is excluded. That is a known Mall policy question
rather than a display bug, and the export describes CTR as it is rather than as it
might become.

---

## `objects[]`

| Field | Class | Notes |
| --- | --- | --- |
| `id` | DB | The identity key. Use this for joins. |
| `assetDirectory` | DB | `object.directory` - the on-disk asset **directory name**. UUID-format for uploads made through the current path, but legacy rows differ (object 2 is `"2"`). Uniqueness is not guaranteed. **Not an identity key.** |
| `name` | DB | Verbatim, unescaped. |
| `creator.memberId` / `creator.username` | DB | Both `null` when the creator's account is gone. The UI's "Deleted User" wording is presentation and never appears here. |
| `price`, `quantity` | DB | |
| `limit` | DB | Raw value. No `unlimited` flag is derived, because CTR's `limit = 0` semantics are unresolved. |
| `sold` | COUNT | `COUNT(object_instance WHERE object_id = ?)`. No `remaining` is synthesized; compute it if you want it and own that choice. |
| `status` / `statusName` | DB / DERIVED | |
| `store` | DB | `mall_object` joined to `place`; `null` when unplaced. |
| `placement` | DB | Parsed `position` / `rotation`; `null` when unplaced. |
| `ctrViews` | DERIVED | Per-object form of the lists above. |
| `createdAt`, `updatedAt`, `mallExpiration` | DB | See `schema.timestamps`. `mallExpiration` is written on approval but never read by CTR. |
| `description` | DB | `NULL` for every production row. |
| `assets.*` | DB | Filenames and public urls only. `derived=0` performs no filesystem access, so no sizes or hashes appear. |

### `objects[].derived` (only when `?derived=1`)

| Field | Class | Notes |
| --- | --- | --- |
| `wrl.storedBytes` | ASSET | Size on disk - the number upload validation measured. |
| `wrl.encoding` | ASSET | `identity` or `gzip`. Many uploads are gzip stored under a `.wrl` name. |
| `wrl.decodedBytes` | ASSET | Size of the actual VRML. **Always reported separately from `storedBytes`.** |
| `wrl.sha256` | ASSET | Hash of the stored bytes. |
| `thumbnail`, `texture` | ASSET | Size and hash, or an error. |
| `vrmlHeader` | DERIVED | First line, verbatim. |
| `worldInfo` | DERIVED | Every WorldInfo node, verbatim. |
| `interpreted` | DERIVED | Best-effort reading of recognised `info[]` prefixes. |
| `comparisons` | DERIVED | `MATCH` / `MISMATCH` / `NOT_FOUND` / `UNPARSED` against the CTR record. **Advisory only.** |
| `nodeCounts` | DERIVED | Fixed, ordered key set, so it stays stable across releases. |
| `textureReferences`, `externalReferences`, `viewpoints`, `warnings` | DERIVED | |
| `sourceError`, `parseError` | DERIVED | Non-null means the scan fields are `null`. **The object is still exported.** |

---

## `result`

Written last. Every number here is measured, not predicted.

| Field | Notes |
| --- | --- |
| `status` | `complete` \| `truncated` \| `failed`. Only `complete` is a dataset. |
| `finishedAt`, `durationMs` | |
| `objectsWritten` | Entries actually emitted. |
| `counts` | `stores`, `objects`, `byStatus`, `ctrViewSizes`, each with its predicate in `counts._definitions`. |
| `truncation` | `null` when complete; otherwise the reason, the limit, and the last object reached. |
| `derived` | Only when `includesDerived`: `attempted`, `succeeded`, `failed`, `failuresByReason`. |

---

## What CTR does not have

Deliberately absent, because no column or file holds them. They belong to an
editorial layer, not to CTR's authoritative data:

- Mall Object Excellence and any other award
- reviewer / checked-by attribution
- category or object type (the store is the only classification)
- rejection reason
- editorial catalog copy
- drop-event grouping

## Privacy

The document contains no credentials, no session tokens, no member data beyond
`memberId` and `username` (both already public throughout the Mall UI), no
filesystem paths, and no server configuration. Assets are referenced by public URL
only. Asset bytes are not bundled; the per-asset `sha256` lets an importer fetch
and verify them lazily.
