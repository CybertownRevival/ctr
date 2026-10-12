/**
 * Regression test for the Pending export control's visibility.
 *
 * Owner QA found "Export Mall Data" still offered while the Pending list said
 * "No items to show" -- a download of an empty document presented as though
 * there were something to export. The control now reads the Pending queue's
 * published count and is offered only when that queue actually has rows.
 *
 * The `null` case matters separately from `0`: before the first count arrives
 * the control must stay hidden rather than appear and then vanish.
 *
 * Run with: node test/staff-tools-export-visibility.test.js
 */

const path = require("path");
const assert = require("assert");
const { loadComponentOptions } = require("./support/load-vue-options");

const STAFF_TOOLS_PATH = path.join(
  __dirname, "..", "src", "pages", "mall", "staff", "StaffTools.vue",
);

function run() {
  const state = { pendingCount: null };
  const options = loadComponentOptions(
    STAFF_TOOLS_PATH,
    (specifier) => (specifier.endsWith("mall-staff-state") ? state : undefined),
  );

  const visible = (routeName, pendingCount) => {
    state.pendingCount = pendingCount;
    const self = { $route: { name: routeName } };
    self.onPendingList = options.computed.onPendingList.call(self);
    return options.computed.showExportControl.call(self);
  };

  assert.strictEqual(visible("MallPending", 2), true,
    "with pending rows, the export control must be offered");
  assert.strictEqual(visible("MallPending", 1), true,
    "a single pending row is still something to export");
  assert.strictEqual(visible("MallPending", 0), false,
    "an empty Pending queue must not offer an export of nothing");
  assert.strictEqual(visible("MallPending", null), false,
    "before the queue has been counted the control must stay hidden");

  // Pending-only: the export publishes the submission queue, so offering it
  // from another list would imply it exports what that list shows.
  assert.strictEqual(visible("MallStocked", 5), false,
    "Stocked must not offer the Pending export");
  assert.strictEqual(visible("MallSoldOut", 5), false,
    "Out of Stock must not offer the Pending export");
  assert.strictEqual(visible("MallObjectSearch", 5), false,
    "Search must not offer the Pending export");
  assert.strictEqual(visible("mall-checker", 5), false,
    "the checker must not offer the Pending export");

  console.log("PASS: staff-tools-export-visibility.test.js");
}

try {
  run();
} catch (error) {
  console.error("FAIL:", error.stack || error.message);
  process.exitCode = 1;
}
