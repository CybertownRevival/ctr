/**
 * Regression test for deferred blob-URL revocation in both of the Mall's
 * client-side downloads: the checker's decoded-WRL download and the staff
 * export's JSON download.
 *
 * Both revoke with `window.setTimeout(() => revokeObjectURL(url), 0)`
 * instead of revoking immediately after `link.click()`, because some
 * browsers fetch a blob url on a later tick and an immediate revoke can
 * cancel the download. There was no regression test proving that shape, so
 * this exercises the real methods against fake `document`/`URL`/`setTimeout`
 * globals injected into the sandbox they run in (see
 * test/support/load-vue-options.js), and asserts on ordering: revoked only
 * after the deferred callback runs, never synchronously after click().
 */

const path = require("path");
const assert = require("assert");
const { loadComponentOptions } = require("./support/load-vue-options");

const CHECKER_PATH = path.join(__dirname, "..", "src", "pages", "mall", "checker.vue");
const STAFF_TOOLS_PATH = path.join(
  __dirname, "..", "src", "pages", "mall", "staff", "StaffTools.vue",
);

function checkerResolveImport(specifier) {
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
    return {
      REJECT_REASON_MAX: 2000,
      objectDisplayName: (object) => (object && object.name) || "(unnamed)",
      rejectReasonError: () => null,
    };
  }
  return undefined;
}

/** A fake DOM sufficient for `createObjectURL` -> `<a>` -> `click()` -> deferred revoke. */
function buildDomFakes() {
  const createCalls = [];
  const revokeCalls = [];
  const createdLinks = [];
  const pendingTimers = [];
  let counter = 0;

  const URL = {
    createObjectURL(blob) {
      const url = `blob:fake-${++counter}`;
      createCalls.push({ url, blob });
      return url;
    },
    revokeObjectURL(url) {
      revokeCalls.push(url);
    },
  };

  const document = {
    createElement() {
      const link = {
        href: "",
        download: "",
        clicked: false,
        click() { link.clicked = true; },
      };
      createdLinks.push(link);
      return link;
    },
    body: {
      appendChild() {},
      removeChild() {},
    },
  };

  function fakeSetTimeout(fn) {
    pendingTimers.push(fn);
    return pendingTimers.length;
  }

  class FakeBlob {
    constructor(parts, options) {
      this.parts = parts;
      this.options = options;
    }
  }

  const window = { URL, document, setTimeout: fakeSetTimeout };

  return {
    window,
    URL,
    document,
    setTimeout: fakeSetTimeout,
    Blob: FakeBlob,
    createCalls,
    revokeCalls,
    createdLinks,
    /** Runs every deferred callback queued so far, in order. */
    runDeferred() {
      pendingTimers.splice(0).forEach((fn) => fn());
    },
  };
}

async function testCheckerDownload() {
  const dom = buildDomFakes();
  const options = loadComponentOptions(CHECKER_PATH, checkerResolveImport, dom);

  const self = {
    isDownloading: false,
    rawSourceError: "",
    objectId: 42,
    $http: {
      async get() {
        return { data: "fake wrl bytes" };
      },
    },
  };

  await options.methods.downloadSource.call(self);

  assert.strictEqual(dom.createCalls.length, 1, "createObjectURL should be called once");
  const { url } = dom.createCalls[0];
  assert.strictEqual(dom.createdLinks.length, 1, "one <a> should be created");
  assert.strictEqual(dom.createdLinks[0].clicked, true, "the link must have been clicked");
  assert.deepStrictEqual(dom.revokeCalls, [],
    "revokeObjectURL must not run synchronously after click()");

  dom.runDeferred();

  assert.deepStrictEqual(dom.revokeCalls, [url],
    "revokeObjectURL must run exactly once, with the created url, once the deferred tick runs");

  console.log("PASS: checker.vue downloadSource defers blob revocation");
}

async function testStaffToolsExportDownload() {
  const dom = buildDomFakes();
  const options = loadComponentOptions(
    STAFF_TOOLS_PATH,
    (specifier) => (specifier.endsWith("mall-staff-state") ? { pendingCount: null } : undefined),
    dom,
  );

  const self = { exportFilename: options.methods.exportFilename };
  const payload = { result: { status: "complete" } };
  const headers = {};

  options.methods.saveExport.call(self, payload, headers);

  assert.strictEqual(dom.createCalls.length, 1, "createObjectURL should be called once");
  const { url } = dom.createCalls[0];
  assert.strictEqual(dom.createdLinks.length, 1, "one <a> should be created");
  assert.strictEqual(dom.createdLinks[0].clicked, true, "the link must have been clicked");
  assert.deepStrictEqual(dom.revokeCalls, [],
    "revokeObjectURL must not run synchronously after click()");

  dom.runDeferred();

  assert.deepStrictEqual(dom.revokeCalls, [url],
    "revokeObjectURL must run exactly once, with the created url, once the deferred tick runs");

  console.log("PASS: StaffTools.vue saveExport defers blob revocation");
}

async function run() {
  await testCheckerDownload();
  await testStaffToolsExportDownload();
  console.log("PASS: blob-download-revocation.test.js");
}

run().catch((error) => {
  console.error("FAIL:", error.stack || error.message);
  process.exitCode = 1;
});
