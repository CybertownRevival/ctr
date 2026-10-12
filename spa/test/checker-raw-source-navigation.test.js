/**
 * Regression test for a stale raw-source response surviving navigation in the
 * Mall checker.
 *
 * `watch.objectId` clears `rawSource`/`rawSourceError`/`showRawSource` on
 * navigation, but previously left `rawSourceFor` pointed at the object being
 * left. `openRawSource`'s own stale-response guard compares against
 * `rawSourceFor`, so a request begun for the old object and still in flight
 * at navigation time would pass that guard when it resolved late and write
 * the old object's source into `rawSource` under the new object's id --
 * silently shown as though it belonged to the new object.
 *
 * Same rationale and technique as checker-navigation.test.js: no test runner
 * exists in this project, so the component's <script> block is transpiled and
 * its watcher/method called directly against a hand-built `this`.
 *
 * Run with: node test/checker-raw-source-navigation.test.js
 */

const path = require("path");
const assert = require("assert");
const { loadComponentOptions } = require("./support/load-vue-options");

const CHECKER_PATH = path.join(__dirname, "..", "src", "pages", "mall", "checker.vue");

function resolveImport(specifier) {
  if (specifier.endsWith("list-query")) {
    return {
      LIST_LIMITS: [10, 20, 50, 100],
      listDefaults: () => ({ limit: 10, order: "ASC" }),
      canonicalListQuery: (state, defaults) => {
        const query = {};
        if (state.page > 1) query.page = String(state.page);
        if (state.limit !== defaults.limit) query.limit = String(state.limit);
        if (state.order !== defaults.order) query.order = state.order;
        return query;
      },
      readListState: () => ({ page: 1, limit: 10, order: "ASC" }),
    };
  }
  if (specifier.endsWith("ObjectViewer.vue")) {
    return {};
  }
  if (specifier.endsWith("CheckerModal.vue")) {
    return {};
  }
  if (specifier.endsWith("mall-actions.mixin")) {
    return {
      REJECT_REASON_MAX: 2000,
      objectDisplayName: (object) => (object && object.name) || "(unnamed)",
      rejectReasonError: () => null,
    };
  }
  return undefined;
}

/** A deferred promise, so the test controls exactly when each fetch resolves. */
function deferred() {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

/** Lets already-queued microtasks (promise .then chains) run. */
function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0)).then(
    () => new Promise((resolve) => setTimeout(resolve, 0)),
  );
}

async function run() {
  const options = loadComponentOptions(CHECKER_PATH, resolveImport);

  const pending = {}; // objectId -> deferred, replaced on each new request for that id
  const getCalls = [];

  const self = {
    rawSource: "",
    showThumbnail: false,
    showFileDetails: false,
    rawSourceError: "",
    rawSourceFor: null,
    showRawSource: false,
    objectId: 1,
    actionError: "",
    actionSuccess: "",
    actionWarning: "",
    rejectReason: "",
    inspection: null,
    // `watch.objectId` also calls `loadInspection`; stub it so this test
    // stays focused on the raw-source state alone.
    loadInspection() {},
    $http: {
      get(url) {
        const idMatch = url.match(/\/mall\/object\/(\d+)\/source/);
        const id = Number(idMatch[1]);
        getCalls.push(id);
        const entry = deferred();
        pending[id] = entry;
        return entry.promise;
      },
    },
  };

  // --- Step 1: object A is rendered; staff opens the raw-source pane. ---
  self.objectId = 1;
  const openA = options.methods.openRawSource.call(self); // fire-and-forget
  assert.strictEqual(self.rawSourceFor, 1, "the in-flight request must be tagged as A's");

  // --- Step 2: before A's source resolves, staff navigates to object B. ---
  self.objectId = 2;
  options.watch.objectId.call(self);

  assert.strictEqual(self.rawSource, "", "rawSource must already be cleared on navigation");
  assert.notStrictEqual(self.rawSourceFor, 1,
    "rawSourceFor must no longer match A, so A's late response cannot pass the guard");

  // --- Step 3: A's response arrives late. ---
  pending[1].resolve({ data: "source of object A" });
  await Promise.all([openA, flush()]);

  assert.strictEqual(self.rawSource, "",
    "a late response for the object that was left must not populate rawSource under B");

  // --- Step 4: staff opens the raw-source pane for B. ---
  const openB = options.methods.openRawSource.call(self);
  assert.strictEqual(self.rawSourceFor, 2, "the new request must be tagged as B's");
  pending[2].resolve({ data: "source of object B" });
  await Promise.all([openB, flush()]);

  assert.strictEqual(self.rawSource, "source of object B",
    "opening the pane for B must fetch and display B's own source");
  assert.deepStrictEqual(getCalls, [1, 2], "exactly one request per object, in order");

  console.log("PASS: checker-raw-source-navigation.test.js");
}

run().catch((error) => {
  console.error("FAIL:", error.stack || error.message);
  process.exitCode = 1;
});
