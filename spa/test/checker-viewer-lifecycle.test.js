/**
 * Regression test for the checker's queue-navigation asset load.
 *
 * OWNER QA DEFECT: Previous Item / Next Item updated the checker, but the
 * item's files and 3D preview did not reliably load. A hard browser refresh
 * fixed it.
 *
 * ROOT CAUSE: `<object-viewer>` was rendered inside `v-else-if="inspection"`,
 * and `watch.objectId` set `inspection = null` on every navigation. So each
 * Previous/Next DESTROYED the viewer component and built a new one once the
 * next inspection resolved -- exactly the X_ITE browser create/dispose cycle
 * `ObjectViewer.vue` documents as leaving later browsers unable to load a
 * world at all. Its own `watch.objectUrl` -> `showObject()` swap path, the
 * whole reason the component holds one browser for its lifetime, was
 * unreachable in practice.
 *
 * THE FIX: the url handed to the viewer lives in `viewerUrl`, which survives
 * navigation, so the viewer stays mounted and is re-pointed. `inspection` is
 * still cleared immediately, so no stale record or moderation control is on
 * screen while the next object loads.
 *
 * These two properties are what this test pins, because they are the ones that
 * fight each other:
 *
 *   1. viewerUrl must NOT be cleared by navigation (or the viewer unmounts);
 *   2. inspection MUST be cleared by navigation (or stale Accept/Reject stays
 *      actionable for an object the checker has already left).
 *
 * Run with: node test/checker-viewer-lifecycle.test.js
 */

const path = require("path");
const assert = require("assert");
const { loadComponentOptions } = require("./support/load-vue-options");

const CHECKER_PATH = path.join(__dirname, "..", "src", "pages", "mall", "checker.vue");

function resolveImport(specifier) {
  if (specifier.endsWith("ObjectViewer.vue") || specifier.endsWith("CheckerModal.vue")) {
    return {};
  }
  if (specifier.endsWith("mall-actions.mixin")) {
    return {
      REJECT_REASON_MAX: 2000,
      objectDisplayName: (object) => (object && object.name) || "(unnamed)",
      rejectReasonError: () => null,
    };
  }
  if (specifier.endsWith("list-query")) {
    return {
      listDefaults: () => ({ limit: 10, order: "ASC" }),
      readListState: () => ({ page: 1, limit: 10, order: "ASC" }),
    };
  }
  return undefined;
}

/** An inspection payload shaped like the one the API returns. */
function inspectionFor(id) {
  return {
    object: {
      id,
      name: `Object ${id}`,
      statusLabel: "Pending",
      assets: { wrl: { url: `/assets/object/dir-${id}/${id}.wrl`, filename: `${id}.wrl` } },
    },
    findings: [],
  };
}

function buildSelf(options, responses) {
  const self = Object.assign({}, options.data(), {
    objectId: 0,
    loadInspection: options.methods.loadInspection,
    $http: {
      async get(url) {
        const id = Number(url.match(/\/mall\/object\/(\d+)\/inspection/)[1]);
        if (responses.fail === id) {
          const error = new Error("nope");
          error.response = { status: 404 };
          throw error;
        }
        return { data: { inspection: inspectionFor(id) } };
      },
    },
  });
  self.loadQueue = async () => {};
  return self;
}

/** Runs the navigation watcher exactly as the route change would. */
async function navigateTo(options, self, id) {
  self.objectId = id;
  options.watch.objectId.call(self);
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function run() {
  const options = loadComponentOptions(CHECKER_PATH, resolveImport);
  const responses = {};
  const self = buildSelf(options, responses);

  // --- A loads. ---
  self.objectId = 101;
  await self.loadInspection.call(self);
  assert.strictEqual(self.viewerUrl, "/assets/object/dir-101/101.wrl",
    "A's model url must reach the viewer");
  assert.ok(self.inspection, "A's record must be present");

  // --- Next to B. The instant the route changes, the record must be gone... ---
  self.objectId = 202;
  options.watch.objectId.call(self);
  assert.strictEqual(self.inspection, null,
    "the previous object's record and moderation controls must go immediately");
  assert.strictEqual(self.viewerUrl, "/assets/object/dir-101/101.wrl",
    "viewerUrl must SURVIVE navigation -- clearing it unmounts the viewer and "
    + "destroys its X_ITE browser, which is the bug this test exists for");

  // ...and once B resolves, the viewer is re-pointed at B.
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.strictEqual(self.viewerUrl, "/assets/object/dir-202/202.wrl",
    "B's model url must reach the viewer without a refresh");
  assert.strictEqual(self.inspection.object.id, 202);

  // --- Previous back to A, then B again: A -> B -> A -> B. ---
  await navigateTo(options, self, 101);
  assert.strictEqual(self.viewerUrl, "/assets/object/dir-101/101.wrl");
  assert.strictEqual(self.inspection.object.id, 101);

  await navigateTo(options, self, 202);
  assert.strictEqual(self.viewerUrl, "/assets/object/dir-202/202.wrl");
  assert.strictEqual(self.inspection.object.id, 202);

  // --- A stale in-flight inspection must not overwrite the current object. ---
  {
    const slow = buildSelf(options, responses);
    let releaseA;
    const gate = new Promise((resolve) => { releaseA = resolve; });
    slow.$http = {
      async get(url) {
        const id = Number(url.match(/\/mall\/object\/(\d+)\/inspection/)[1]);
        if (id === 101) {
          await gate;
        }
        return { data: { inspection: inspectionFor(id) } };
      },
    };

    slow.objectId = 101;
    const pendingA = slow.loadInspection.call(slow);

    slow.objectId = 202;
    options.watch.objectId.call(slow);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.strictEqual(slow.inspection.object.id, 202);

    releaseA();
    await pendingA;
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.strictEqual(slow.inspection.object.id, 202,
      "A's late inspection must not replace B's record");
    assert.strictEqual(slow.viewerUrl, "/assets/object/dir-202/202.wrl",
      "A's late inspection must not re-point the viewer away from B");
  }

  // --- A failed load must not leave the previous object's model on screen. ---
  {
    const failing = buildSelf(options, { fail: 303 });
    failing.objectId = 101;
    await failing.loadInspection.call(failing);
    assert.strictEqual(failing.viewerUrl, "/assets/object/dir-101/101.wrl");

    await navigateTo(options, failing, 303);
    assert.ok(failing.loadError, "the failure must be reported");
    assert.strictEqual(failing.inspection, null);
    assert.strictEqual(failing.viewerUrl, "",
      "the previous object's model must not sit under an error as though it were this one");
  }

  console.log("PASS: checker-viewer-lifecycle.test.js");
}

run().catch((error) => {
  console.error("FAIL:", error.stack || error.message);
  process.exitCode = 1;
});
