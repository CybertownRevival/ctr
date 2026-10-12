/**
 * Regression test for the checker's rejection-outcome messaging.
 *
 * `/mall/reject` returns `{ notified: false, alreadyRejected: true }` for the
 * losing request in a concurrent rejection: another request already won the
 * row-lock race and completed the rejection, so this one never attempted a
 * notification at all. Before this fix, `rejectObject` only checked
 * `notified === false` and told staff "the uploader could not be notified.
 * Follow up manually." for that case too, which is false -- no notification
 * was attempted or failed, there is nothing to follow up on.
 *
 * See checker-navigation.test.js for why this loads the component this way.
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
    return {
      REJECT_REASON_MAX: 2000,
      objectDisplayName: (object) => (object && object.name) || "(unnamed)",
      rejectReasonError: () => null,
    };
  }
  return undefined;
}

/**
 * A `self` whose `performAction` is stubbed to hand back a fixed response
 * body, replicating just the one side effect of the real method (`rejectObject`
 * doesn't set the default success message itself -- `performAction` does).
 */
function buildSelf(responseData) {
  return {
    object: { id: 42, name: "Fixture Object" },
    isProcessing: false,
    actionError: "",
    actionSuccess: "",
    actionWarning: "",
    rejectReason: "some reason",
    async performAction(endpoint, body, success) {
      this.actionSuccess = success;
      return responseData;
    },
  };
}

async function run() {
  const options = loadComponentOptions(CHECKER_PATH, resolveImport);
  assert.strictEqual(typeof options.methods.rejectObject, "function");

  // --- Normal successful rejection, uploader notified. ---
  {
    const self = buildSelf({ status: "success", notified: true });
    await options.methods.rejectObject.call(self, "some reason");
    assert.strictEqual(self.actionSuccess, "Object rejected and the uploader notified.");
    assert.strictEqual(self.actionWarning, "");
  }

  // --- Genuine notification failure: the rejection completed, the email didn't. ---
  {
    const self = buildSelf({ status: "success", notified: false });
    await options.methods.rejectObject.call(self, "some reason");
    assert.strictEqual(self.actionSuccess, "Object rejected.");
    assert.ok(
      self.actionWarning.includes("could not be notified"),
      `expected a notification-failure warning, got: ${self.actionWarning}`,
    );
  }

  // --- Race loser: alreadyRejected, notified: false, but nothing failed. ---
  {
    const self = buildSelf({ status: "success", notified: false, alreadyRejected: true });
    await options.methods.rejectObject.call(self, "some reason");
    assert.strictEqual(self.actionSuccess, "Object was already rejected.");
    assert.strictEqual(self.actionWarning, "",
      "alreadyRejected must not be reported as a notification failure");
    assert.ok(
      !self.actionSuccess.toLowerCase().includes("notified"),
      "alreadyRejected must not claim this request notified anyone",
    );
  }

  console.log("PASS: checker-reject-messaging.test.js");
}

run().catch((error) => {
  console.error("FAIL:", error.stack || error.message);
  process.exitCode = 1;
});
