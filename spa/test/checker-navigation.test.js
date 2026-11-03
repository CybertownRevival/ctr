/**
 * Regression test for the Mall checker's stale-inspection-during-navigation bug.
 *
 * The SPA has no test runner (no Jest, no vue-test-utils, no jsdom) anywhere
 * in this project, and adding one is out of scope for this single fix. This
 * script instead extracts the component's <script> block from checker.vue,
 * transpiles it with the TypeScript compiler that is already a devDependency
 * (no new packages), and calls its `watch.objectId` / `methods.loadInspection`
 * directly against a hand-built `this` -- no DOM or Vue instance required,
 * since the bug and its fix live entirely in plain state transitions, not
 * rendering.
 *
 * Run with: node test/checker-navigation.test.js
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
  if (specifier.endsWith("ObjectViewer.vue") || specifier.endsWith("CheckerModal.vue")) {
    return {};
  }
  if (specifier.endsWith("mall-actions.mixin")) {
    // Only rejectReason validation depends on this; unrelated to navigation.
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
  assert.strictEqual(typeof options.watch.objectId, "function", "watch.objectId must exist");
  assert.strictEqual(
    typeof options.methods.loadInspection, "function", "methods.loadInspection must exist",
  );

  const inspectionA = { object: { id: 1, name: "Object A" }, findings: [] };
  const inspectionB = { object: { id: 2, name: "Object B" }, findings: [] };

  const pending = {}; // objectId -> deferred, replaced on each new request for that id
  const getCalls = [];

  const self = {
    accessDenied: false,
    loadError: "",
    inspection: null,
    inspectionFor: null,
    rawSource: "",
    rawSourceError: "",
    showRawSource: false,
    isProcessing: false,
    actionError: "",
    actionSuccess: "",
    actionWarning: "",
    rejectReason: "",
    $route: { params: { object_id: "1" }, query: {} },
    $http: {
      get(url) {
        const idMatch = url.match(/\/mall\/object\/(\d+)\/inspection/);
        const id = Number(idMatch[1]);
        getCalls.push(id);
        const entry = deferred();
        pending[id] = entry;
        return entry.promise;
      },
    },
  };
  Object.defineProperty(self, "objectId", {
    get() {
      return options.computed.objectId.call(self);
    },
  });
  // The watcher calls `this.loadInspection()` on the real component instance,
  // which resolves through Vue's method binding; replicate that here.
  self.loadInspection = options.methods.loadInspection.bind(self);

  // --- Step 1: object A is currently rendered. ---
  self.$route = { params: { object_id: "1" }, query: {} };
  options.methods.loadInspection.call(self); // fire-and-forget, like the real watcher/mounted() do
  pending[1].resolve({ data: { inspection: inspectionA } });
  await flush();
  assert.deepStrictEqual(
    self.inspection, inspectionA, "object A should be rendered after its load resolves",
  );

  // A second, slower request for A is still in flight (e.g. a retry/race) when
  // navigation happens below -- this is what proves late A responses can't win.
  options.methods.loadInspection.call(self);
  const staleAResponse = pending[1];

  // --- Step 2: route changes to object B. ---
  self.$route = { params: { object_id: "2" }, query: {} };
  options.watch.objectId.call(self);

  // --- Step 3: before B's inspection response resolves ---
  assert.strictEqual(self.inspection, null,
    "A must be cleared synchronously on navigation, before B's request even resolves");
  // The template renders Accept/Reject/Edit/Findings only inside
  // `v-else-if="inspection"`, and "Loading..." otherwise (checker.vue:14,276),
  // so a null inspection *is* the loading state with no stale controls live.
  assert.strictEqual(self.inspectionFor, 2, "the stale-response guard must already point at B");

  // --- Step 4: the delayed response for A arrives late and must be discarded. ---
  staleAResponse.resolve({ data: { inspection: inspectionA } });
  await flush();
  assert.strictEqual(self.inspection, null,
    "a late response for the previous object must not overwrite the current (still-loading) state");

  // --- Step 5: B's response resolves and renders B normally. ---
  pending[2].resolve({ data: { inspection: inspectionB } });
  await flush();
  assert.deepStrictEqual(self.inspection, inspectionB, "object B should now be rendered");
  assert.deepStrictEqual(
    getCalls, [1, 1, 2], "exactly the expected requests were issued, in order",
  );

  console.log("PASS: checker-navigation.test.js");
}

run().catch((error) => {
  console.error("FAIL:", error.stack || error.message);
  process.exitCode = 1;
});
