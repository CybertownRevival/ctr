/**
 * Regression test for the checker's acceptance-outcome messaging.
 *
 * Owner QA finding: Reject told the uploader what happened, Accept was silent.
 * `/mall/approve` now notifies the uploader after the Pending -> Warehouse
 * transition commits, and reports the same three outcomes Reject does. They
 * must not be conflated:
 *
 *   notified: true                     -> accepted and the uploader told
 *   notified: false                    -> accepted, the notice failed, follow up
 *   alreadyAccepted, notified: false   -> a concurrent Accept already won; this
 *                                         request moved nothing and attempted
 *                                         no notification, so there is nothing
 *                                         to follow up on
 *
 * See checker-navigation.test.js for why this loads the component this way.
 *
 * Run with: node test/checker-accept-messaging.test.js
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
 * `approveObject` does not set the default success message itself --
 * `performAction` does -- so the stub replicates that one side effect.
 */
function buildSelf(responseData) {
  return {
    object: { id: 42, name: "Fixture Object" },
    isProcessing: false,
    actionError: "",
    actionSuccess: "",
    actionWarning: "",
    async performAction(endpoint, body, success) {
      this.actionSuccess = success;
      return responseData;
    },
  };
}

async function run() {
  const options = loadComponentOptions(CHECKER_PATH, resolveImport);
  assert.strictEqual(typeof options.methods.approveObject, "function");

  // --- Normal successful acceptance, uploader notified. ---
  {
    const self = buildSelf({ status: "success", notified: true });
    await options.methods.approveObject.call(self);
    assert.strictEqual(self.actionSuccess, "Object accepted and the uploader notified.");
    assert.strictEqual(self.actionWarning, "");
  }

  // --- Genuine notification failure: the acceptance completed, the notice didn't. ---
  {
    const self = buildSelf({ status: "success", notified: false });
    await options.methods.approveObject.call(self);
    assert.strictEqual(self.actionSuccess, "Object accepted.");
    assert.ok(
      self.actionWarning.includes("could not be notified"),
      `expected a notification-failure warning, got: ${self.actionWarning}`,
    );
  }

  // --- Race loser: alreadyAccepted, notified: false, but nothing failed. ---
  {
    const self = buildSelf({ status: "success", notified: false, alreadyAccepted: true });
    await options.methods.approveObject.call(self);
    assert.strictEqual(self.actionSuccess, "Object was already accepted.");
    assert.strictEqual(self.actionWarning, "",
      "alreadyAccepted must not be reported as a notification failure");
    assert.ok(
      !self.actionSuccess.toLowerCase().includes("notified"),
      "alreadyAccepted must not claim this request notified anyone",
    );
  }

  // --- A failed request must not claim an acceptance happened. ---
  {
    const self = buildSelf(null);
    self.performAction = async function performAction() {
      this.actionError = "Only a pending object can be accepted.";
      return null;
    };
    await options.methods.approveObject.call(self);
    assert.strictEqual(self.actionSuccess, "");
    assert.strictEqual(self.actionWarning, "");
  }

  console.log("PASS: checker-accept-messaging.test.js");
}

run().catch((error) => {
  console.error("FAIL:", error.stack || error.message);
  process.exitCode = 1;
});
