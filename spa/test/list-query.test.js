/**
 * Regression test for staff-list URL canonicalization.
 *
 * Owner QA: visiting the Warehouse produced
 *
 *     #/mall/warehouse?page=1&limit=10&order=ASC
 *
 * three parameters that all say "unchanged from normal". Only what differs
 * from the list's own defaults is written now, and every explicit URL that
 * already exists must still restore correctly.
 *
 * The per-list defaults are NOT uniform -- Stocked sorts newest first -- and
 * getting that wrong would silently re-sort a list, so it is asserted directly.
 *
 * Run with: node test/list-query.test.js
 */

const path = require("path");
const assert = require("assert");
const { loadModule } = require("./support/load-vue-options");

const LIST_QUERY_PATH = path.join(
  __dirname, "..", "src", "pages", "mall", "staff", "list-query.ts",
);

/**
 * The module is evaluated in a vm context, so its objects have that realm's
 * prototypes and `deepStrictEqual` rejects them on identity alone. Comparing
 * the plain data is the actual intent here.
 */
function same(actual, expected, message) {
  assert.deepStrictEqual(
    JSON.parse(JSON.stringify(actual)),
    JSON.parse(JSON.stringify(expected)),
    message,
  );
}

function run() {
  const {
    LIST_DEFAULTS,
    canonicalListQuery,
    listDefaults,
    readListState,
  } = loadModule(LIST_QUERY_PATH);

  // --- Per-list defaults are the pages' real defaults. ---
  same(LIST_DEFAULTS.pending, { limit: 10, order: "ASC" });
  same(LIST_DEFAULTS.warehouse, { limit: 10, order: "ASC" });
  same(LIST_DEFAULTS.stocked, { limit: 10, order: "DESC" },
    "Stocked shows newest first; assuming ASC here would re-sort it");
  same(LIST_DEFAULTS.soldout, { limit: 10, order: "ASC" });

  // --- Default state writes nothing. ---
  for (const list of ["pending", "warehouse", "stocked", "soldout"]) {
    const d = listDefaults(list);
    same(
      canonicalListQuery({ page: 1, limit: d.limit, order: d.order }, d), {},
      `${list} at its defaults must produce a clean URL`,
    );
  }

  // --- Non-default state writes only what differs. ---
  const warehouse = listDefaults("warehouse");
  same(
    canonicalListQuery({ page: 1, limit: 10, order: "DESC" }, warehouse),
    { order: "DESC" });
  same(
    canonicalListQuery({ page: 2, limit: 10, order: "ASC" }, warehouse),
    { page: "2" });
  same(
    canonicalListQuery({ page: 1, limit: 20, order: "DESC" }, warehouse),
    { limit: "20", order: "DESC" });
  same(
    canonicalListQuery({ page: 3, limit: 50, order: "DESC" }, warehouse),
    { page: "3", limit: "50", order: "DESC" });

  // Stocked's default IS DESC, so DESC writes nothing there and ASC does.
  const stocked = listDefaults("stocked");
  same(
    canonicalListQuery({ page: 1, limit: 10, order: "DESC" }, stocked), {});
  same(
    canonicalListQuery({ page: 1, limit: 10, order: "ASC" }, stocked),
    { order: "ASC" });

  // --- Values are strings, so vue-router's duplicate-navigation check sees
  //     a canonical query and the one read back from the URL as equal. ---
  const q = canonicalListQuery({ page: 2, limit: 20, order: "DESC" }, warehouse);
  Object.keys(q).forEach((key) => {
    assert.strictEqual(typeof q[key], "string", `${key} must be a string`);
  });

  // --- Existing explicit URLs still restore. ---
  same(
    readListState({ page: "1", limit: "10", order: "ASC" }, warehouse),
    { page: 1, limit: 10, order: "ASC" },
    "the old fully-explicit URL must still restore");
  same(
    readListState({ page: "2", limit: "50", order: "DESC" }, warehouse),
    { page: 2, limit: 50, order: "DESC" });

  // --- An absent parameter means the list's default, not a global one. ---
  same(readListState({}, warehouse),
    { page: 1, limit: 10, order: "ASC" });
  same(readListState({}, stocked),
    { page: 1, limit: 10, order: "DESC" },
    "a clean Stocked URL must restore DESC, not ASC");

  // --- Malformed input lands on a sane list rather than an error. ---
  same(readListState({ page: "0" }, warehouse).page, 1);
  same(readListState({ page: "-4" }, warehouse).page, 1);
  same(readListState({ page: "banana" }, warehouse).page, 1);
  same(readListState({ limit: "37" }, warehouse).limit, 10,
    "a page size the list does not offer is ignored");
  same(readListState({ order: "sideways" }, warehouse).order, "ASC");
  same(readListState({ order: "sideways" }, stocked).order, "DESC");

  // --- Round trip: canonical -> read -> canonical is stable. ---
  const cases = [
    { page: 1, limit: 10, order: "ASC" },
    { page: 2, limit: 20, order: "DESC" },
    { page: 7, limit: 100, order: "ASC" },
  ];
  cases.forEach((state) => {
    const written = canonicalListQuery(state, warehouse);
    const read = readListState(written, warehouse);
    same(read, state, `round trip must be stable for ${JSON.stringify(state)}`);
  });

  // An unknown list name still gets usable defaults rather than throwing.
  same(listDefaults("nope"), { limit: 10, order: "ASC" });

  console.log("PASS: list-query.test.js");
}

try {
  run();
} catch (error) {
  console.error("FAIL:", error.stack || error.message);
  process.exitCode = 1;
}
