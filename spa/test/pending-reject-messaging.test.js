/**
 * Regression test for the Pending list's rejection-outcome messaging -- the
 * same bug as checker-reject-messaging.test.js, in `pending.vue`'s own
 * `reject()` method instead of the checker's `rejectObject()`.
 *
 * See checker-navigation.test.js for why this loads the component this way.
 */

const path = require("path");
const assert = require("assert");
const { loadComponentOptions } = require("./support/load-vue-options");

const PENDING_PATH = path.join(__dirname, "..", "src", "pages", "mall", "staff", "pending.vue");

function resolveImport(specifier, identityExtend) {
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
  if (specifier.endsWith("MallObjectRow.vue") || specifier.endsWith("Modal.vue")) {
    return {};
  }
  if (specifier.endsWith("mall-staff-state")) {
    return { pendingCount: null };
  }
  if (specifier.endsWith("mall-actions.mixin")) {
    // `pending.vue` is `mallActions.extend({...})`: the default export needs
    // its own `.extend()`, matching the real mixin's shape -- reuse the same
    // identity-extend the loader gives `vue` itself, one level deeper.
    return {
      __esModule: true,
      default: identityExtend,
      REJECT_REASON_MAX: 2000,
      objectDisplayName: (object) => (object && object.name) || "(unnamed)",
      rejectReasonError: () => null,
    };
  }
  return undefined;
}

/** A `self` with just what `reject()` touches, real `$http.post` stubbed. */
function buildSelf(responseData) {
  return {
    isProcessing: false,
    rejecting: { id: 42, name: "Fixture Object" },
    rejectReason: "some reason",
    rejectError: "",
    success: "",
    showSuccess: false,
    showError: false,
    error: "",
    $http: {
      async post() {
        return { data: responseData };
      },
    },
    reportError() {},
    async getResults() {},
  };
}

async function run() {
  const options = loadComponentOptions(PENDING_PATH, resolveImport);
  assert.strictEqual(typeof options.methods.reject, "function");

  // --- Normal successful rejection, uploader notified. ---
  {
    const self = buildSelf({ status: "success", notified: true });
    await options.methods.reject.call(self, 42, "some reason");
    assert.strictEqual(self.success, "Object rejected and the uploader notified.");
    assert.strictEqual(self.showSuccess, true);
  }

  // --- Genuine notification failure. ---
  {
    const self = buildSelf({ status: "success", notified: false });
    await options.methods.reject.call(self, 42, "some reason");
    assert.ok(
      self.success.includes("could not be notified"),
      `expected a notification-failure message, got: ${self.success}`,
    );
  }

  // --- Race loser: alreadyRejected, notified: false, but nothing failed. ---
  {
    const self = buildSelf({ status: "success", notified: false, alreadyRejected: true });
    await options.methods.reject.call(self, 42, "some reason");
    assert.strictEqual(self.success, "Object was already rejected.");
    assert.ok(
      !self.success.toLowerCase().includes("notified"),
      "alreadyRejected must not claim this request notified anyone or that one failed",
    );
  }

  console.log("PASS: pending-reject-messaging.test.js");
}

run().catch((error) => {
  console.error("FAIL:", error.stack || error.message);
  process.exitCode = 1;
});
