import Vue from "vue";

/**
 * The three staff actions that are byte-identical across every Mall staff list
 * today: the access probe, Edit Name and Update Limit.
 *
 * Deliberately narrow. Each list's `getResults` and pagination differ in real
 * ways - Out of Stock fetches a different endpoint and has no paging at all,
 * Search pages by raw offset while the others page by page number - so forcing
 * one abstraction over them would add risk rather than remove it.
 *
 * Consumers must provide a `getResults()` method; it is called after a
 * successful edit so the list reflects the change.
 */
/**
 * Longest rejection reason the API accepts.
 *
 * Mirrored from the server so staff are stopped before a request rather than
 * after one. The server stays the authority.
 */
export const REJECT_REASON_MAX = 2000;

/**
 * Shared so the checker and the Pending list refuse exactly the same input.
 *
 * Returns the message to show, or null when the reason is acceptable.
 */
export function rejectReasonError(reason: string): string | null {
  const trimmed = (reason || "").trim();
  if (!trimmed) {
    return "A reason for rejection is required.";
  }
  if (trimmed.length > REJECT_REASON_MAX) {
    return `A rejection reason may be at most ${REJECT_REASON_MAX} characters.`;
  }
  return null;
}

/**
 * A name for an object safe to put in a staff-facing sentence.
 *
 * Objects can reach staff with a null or blank name, and "was rejected" with
 * nothing in front of it reads as a bug rather than as a warning.
 */
export function objectDisplayName(object: any): string {
  const name = String((object && object.name) || "").trim();
  if (name) {
    return name;
  }
  const id = object && object.id;
  return id ? `Object #${id}` : "The object";
}

export default Vue.extend({
  data() {
    return {
      canAdmin: false,
      error: "",
      showError: false,
      success: "",
      showSuccess: false,
    };
  },
  methods: {
    async isMallStaff(): Promise<void> {
      try {
        await this.$http.get("/mall/can_admin");
        this.canAdmin = true;
      } catch (error) {
        this.canAdmin = false;
      }
    },

    reportError(errorResponse: any): void {
      const data = errorResponse && errorResponse.response && errorResponse.response.data;
      this.error = (data && data.error) || "An unknown error occurred";
      this.showError = true;
    },

    async updateName(objectId: number, name: string): Promise<void> {
      this.showSuccess = false;
      this.showError = false;
      const newName = window.prompt(`Current Name:\n ${name}\n\nNew Name:`, name);
      if (newName === null || newName === "") {
        return;
      }
      try {
        this.error = "";
        this.showError = false;
        await this.$http.post("/mall/updateObjectName", {
          objectId,
          name: newName,
        });
        this.success = "Object name updated!";
        this.showSuccess = true;
        await (this as any).getResults();
      } catch (errorResponse: any) {
        this.reportError(errorResponse);
      }
    },

    async updateLimit(objectId: number, quantity: number): Promise<void> {
      this.showSuccess = false;
      this.showError = false;
      const entered = window.prompt(
        "Update limit to this object\n NOTE: Setting the limit to 0 makes it Unlimited\n",
      );
      if (entered === null || entered === "") {
        return;
      }
      const digits = entered.replace(/[^0-9]/g, "");
      if (digits !== entered) {
        this.error = "Use whole numbers only!";
        this.showError = true;
        return;
      }
      if (digits !== "0" && Number.parseInt(digits, 10) < quantity) {
        this.error = "Limit cannot be less than the uploaded quantity.";
        this.showError = true;
        return;
      }
      try {
        this.error = "";
        this.showError = false;
        await this.$http.post("/mall/limit", {
          objectId,
          limit: digits,
        });
        this.success = "Object limit updated!";
        this.showSuccess = true;
        await (this as any).getResults();
      } catch (errorResponse: any) {
        this.reportError(errorResponse);
      }
    },
  },
});
