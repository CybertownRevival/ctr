<template>
  <div class="w-full flex">
    <div class="flex flex-col w-full place-items-center">
      <div class="text-red-500" v-show="error">{{ error }}</div>
      <div class="text-center w-full text-5xl mb-1">Mall Object Search</div>
      <div class="grid grid-cols-2 w-4/6 justify-items-center">
        <div>
          Search Mall Objects:
          <input class="text-black" type="text" v-model="search" @input="searchObjects" />
        </div>
        <div>
          View Amount:
          <select v-model.number="limit" @change="searchObjects">
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>
      <br />
      <div class="grid-cols-1 w-4/6 justify-items-center text-center">
        Total Count: {{ totalCount }}
      </div>
      <mall-object-row v-for="object in objects"
                       :key="object.id"
                       :object="object"
                       check-from="search"
                       :check-query="listQuery">
        <template v-slot:actions>
          <button class="btn-ui" @click="updateName(object.id, object.name)">Edit Name</button>
          <button class="btn-ui"
                  @click="updateLimit(object.id, object.quantity)">Update Limit</button>
          <button v-if="object.status === 1"
                  class="btn-ui"
                  @click="remove(object.id)">Move To Warehouse</button>
        </template>
      </mall-object-row>
      <div class="grid grid-cols-2 w-4/6 justify-items-center">
        <div class="p-1 text-right w-full">
          <button class="btn" @click="back" v-show="offset !== 0">BACK</button>
        </div>
        <div class="p-1 text-left w-full">
          <button class="btn" @click="next" v-show="totalCount - offset >= limit">NEXT</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import MallObjectRow from "@/components/mall/MallObjectRow.vue";
import mallActions from "./mall-actions.mixin";

export default mallActions.extend({
  name: "MallObjectSearch",
  components: { MallObjectRow },
  data() {
    return {
      objects: [],
      loaded: false,
      totalCount: 0,
      limit: 10,
      offset: 0,
      showNext: true,
      search: "",
    };
  },
  computed: {
    listQuery(): any {
      return { search: this.search, limit: this.limit, offset: this.offset };
    },
  },
  async mounted(): Promise<void> {
    this.loaded = true;
    this.restoreListState();
    this.isMallStaff();
    await this.getResults();
  },
  methods: {
    /**
     * Puts back the search term and page the checker was opened from.
     *
     * `check-query` already carries them into the checker, and its "Back to
     * Search" hands them back on the way out, but nothing here read them -- so
     * returning from an object dropped staff onto an empty, first-page search
     * and made them retype it. Mirrors `restoreListState` in the other staff
     * lists, differing only because this list pages by raw offset.
     */
    restoreListState(): void {
      const query = this.$route.query;
      const limit = Number.parseInt(String(query.limit || ""), 10);
      const offset = Number.parseInt(String(query.offset || ""), 10);
      if ([10, 20, 50, 100].indexOf(limit) !== -1) {
        this.limit = limit;
      }
      if (Number.isFinite(offset) && offset >= 0) {
        this.offset = offset;
      }
      if (typeof query.search === "string") {
        this.search = query.search;
      }
    },
    syncListState(): void {
      this.$router.replace({
        path: this.$route.path,
        query: {
          search: this.search,
          limit: String(this.limit),
          offset: String(this.offset),
        },
      }).catch(() => undefined);
    },
    async searchObjects(): Promise<any> {
      this.offset = 0;
      await this.getResults();
    },
    async getResults(): Promise<void> {
      this.syncListState();
      try {
        const searched = await this.$http.get("/mall/objectsearch/", {
          limit: this.limit,
          offset: this.offset,
          search: this.search,
        });
        this.objects = searched.data.results.objects;
        this.totalCount = searched.data.results.total[0].count;
      } catch (errorResponse: any) {
        this.reportError(errorResponse);
      }
    },
    async remove(objectId): Promise<void> {
      this.showSuccess = false;
      this.showError = false;
      try {
        this.error = "";
        this.showError = false;
        await this.$http.post("/mall/remove", { objectId: objectId });
        this.success = "Object removed from store.";
        this.showSuccess = true;
        this.getResults();
      } catch (errorResponse: any) {
        this.reportError(errorResponse);
      }
    },
    async next() {
      this.offset = this.offset + this.limit;
      await this.getResults();
    },
    async back() {
      this.offset = this.offset - this.limit;
      await this.getResults();
      this.showNext = true;
    },
  },
});
</script>
