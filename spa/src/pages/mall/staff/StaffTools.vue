<template>
  <div v-if="canAdmin">
    <router-link class="btn-ui" :to="{name: 'MallPending'}">Pending</router-link>
    <router-link class="btn-ui" :to="{name: 'MallStocked'}">Stocked</router-link>
    <router-link class="btn-ui" :to="{name: 'MallSoldOut'}">Out of Stock</router-link>
    <router-link class="btn-ui" :to="{name: 'MallObjectSearch'}">Search</router-link>
    <!--
      A popup, not a route change: the dropper announces the drop in Mall chat
      and walks the main window into the destination store, so taking that
      window over with the warehouse list is exactly what must not happen.
    -->
    <button class="btn-ui" @click="openWarehouse">Warehouse</button>
    <br />
    <!--
      Pending only, and only when Pending has something in it. The export
      publishes the submission queue to the Mall's own site, so offering it
      from Stocked or Search would imply it exports what that list shows, and
      offering it over an empty queue offers a download of nothing.
    -->
    <button v-if="showExportControl" class="btn-ui" @click="openExport">
      Export Pending JSON
    </button>
    <br v-if="showExportControl" />
    <router-link class="btn-ui" :to="{path: '/place/mall'}">Return to Mall</router-link>
    <br />

    <!-- Export Pending JSON -->
    <div v-if="showExport"
         class="fixed inset-0 flex items-center justify-center p-4"
         style="background: rgba(0,0,0,0.7); z-index: 50;">
      <div class="border-2 border-white p-4 overflow-y-auto"
           style="background:#001829; max-width: 34rem; max-height: 90vh;">
        <h3 class="mb-2">Export Pending JSON</h3>
        <p class="text-sm mb-2">
          Downloads the pending submission queue as one JSON file: every object
          awaiting review, with the WorldInfo and CTR facts for each. Stocked,
          warehoused, sold-out and removed objects are not included.
        </p>
        <p class="text-xs mb-2 opacity-80">
          The full list of Mall stores is included as reference data, so a store
          name can be resolved later. It does not mean those stores' objects are
          in the file.
        </p>
        <label class="block mb-2">
          <input type="checkbox" v-model="includeDerived" :disabled="exporting" />
          Include WRL-derived metadata (WorldInfo, node counts, file sizes, hashes)
        </label>
        <p v-if="includeDerived" class="text-xs mb-2 opacity-80">
          This reads and decompresses every stored object file, so it takes noticeably
          longer than the plain export.
        </p>
        <div v-if="exportError" class="text-red-500 mb-2">{{ exportError }}</div>
        <div v-if="exporting" class="mb-2">Exporting&hellip;</div>
        <div class="text-right">
          <button class="btn mr-2" :disabled="exporting" @click="closeExport">Cancel</button>
          <button class="btn" :disabled="exporting" @click="runExport">Export</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

import mallStaffState from "./mall-staff-state";

export default Vue.extend({
  name: "MallStaffTools",
  data: () => {
    return {
      canAdmin: false,
      showExport: false,
      includeDerived: false,
      exporting: false,
      exportError: "",
    };
  },
  async mounted(): Promise<void> {
    await this.isMallStaff();
  },
  computed: {
    onPendingList(): boolean {
      return this.$route.name === "MallPending";
    },
    /**
     * Hidden until the queue has actually been counted, so the control never
     * appears over an empty list and then vanishes once the count arrives.
     */
    showExportControl(): boolean {
      return this.onPendingList
        && mallStaffState.pendingCount !== null
        && mallStaffState.pendingCount > 0;
    },
  },
  watch: {
    showExportControl(available: boolean) {
      if (!available) {
        this.showExport = false;
      }
    },
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

    openWarehouse(): void {
      window.open(
        "#/mall/warehouse",
        "mallWarehouse",
        "height=650,width=900,menubar=no,status=no",
      );
    },

    openExport(): void {
      this.exportError = "";
      this.showExport = true;
    },

    closeExport(): void {
      this.showExport = false;
    },

    /**
     * Downloads the export, but only once it has proved it is complete.
     *
     * The export writes its outcome at the END of the document, so a stream that
     * was cut short has no `result` and will not even parse. Saving anything that
     * fails these checks would put a file on disk that looks like a dataset and
     * is not one, so nothing is written unless `result.status` says complete.
     */
    async runExport(): Promise<void> {
      this.exporting = true;
      this.exportError = "";
      try {
        const response = await this.$http.get("/mall/export", {
          derived: this.includeDerived ? 1 : 0,
        });
        const payload: any = response.data;

        if (typeof payload !== "object" || payload === null || !payload.result) {
          this.exportError = "Export incomplete - the response was cut short. Not saved.";
          return;
        }
        if (payload.result.status !== "complete") {
          const truncation = payload.result.truncation;
          const reason = truncation && truncation.reason ? ` (${truncation.reason})` : "";
          const last = truncation && truncation.lastObjectId
            ? ` Last object reached: #${truncation.lastObjectId}.`
            : "";
          this.exportError =
            `Export ${payload.result.status}${reason}. Not saved.${last}`;
          return;
        }

        this.saveExport(payload, response.headers);
        this.showExport = false;
      } catch (error) {
        this.exportError = "The export could not be completed. Not saved.";
      } finally {
        this.exporting = false;
      }
    },

    saveExport(payload: any, headers: any): void {
      // Serialised compactly here on purpose: the server already streams the
      // document indented, and this is only the fallback path for a payload the
      // http layer has already parsed. Re-indenting it would build a third full
      // copy of the largest string in the app.
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = this.exportFilename(headers);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Deferred a tick: some browsers fetch the blob url after the current task
      // ends, and revoking synchronously cancels the download.
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    },

    /**
     * Prefers the name the server already chose.
     *
     * `exportMallData` sends a Content-Disposition whose stamp is precise to the
     * second, so two exports taken minutes apart are distinct files. The local
     * fallback matches that precision rather than the old date-only name, which
     * collided for every export after the first on any given day.
     */
    exportFilename(headers: any): string {
      const disposition = headers && (headers["content-disposition"]
        || headers["Content-Disposition"]);
      const match = /filename="([^"]+)"/.exec(String(disposition || ""));
      if (match && /^[\w.-]+$/.test(match[1])) {
        return match[1];
      }
      const stamp = new Date().toISOString().split(".")[0].replace(/:/g, "");
      return `ctr-mall-export-${stamp}Z.json`;
    },
  },
});
</script>
