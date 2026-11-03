<template>
  <div class="w-full flex">
    <div class="flex flex-col w-full place-items-center">
      <div class="text-red-500" v-show="error">{{ error }}</div>
      <div class="text-center w-full text-5xl mb-1">Mall Stocked Objects</div>
      <div class="grid grid-cols-2 w-4/6 justify-items-center">
        <div v-if="totalCount !== 0">
          Sort By:
          <select v-model="orderBy" @change="setLimit">
            <option value="ASC">Oldest First</option>
            <option value="DESC">Newest First</option>
          </select>
        </div>
        <div v-if="totalCount !== 0">
          View Amount:
          <select v-model.number="limit" @change="setLimit">
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
      <span v-if="pages.length > 1">Pages</span>
      <div v-if="pages.length > 1" class="flex w-full justify-center font-bold">
        <span class="flex justify-center" v-for="page in pages" :key="page" :value="page">
          <span class="p-2" v-if="pageNum === page">{{ page }}</span>
          <span class="p-2 cursor-pointer"
                style="color:lime;"
                v-else-if="page > (pageNum - 5) && page < (pageNum + 5)"
                @click="setPageNumber(page)">{{ page }}</span>
        </span>
        <span class="p-2 font-bold"
              style="color:lime;"
              v-if="(pageNum + 5) <= pages.length">. . .</span>
      </div>
      <div v-if="totalCount === 0">No items to show</div>
      <div v-else>
        <mall-object-row v-for="object in objects"
                         :key="object.id"
                         :object="object"
                         check-from="stocked"
                         :check-query="listQuery">
          <template v-slot:actions>
            <button class="btn-ui" @click="updateName(object.id, object.name)">Edit Name</button>
            <button class="btn-ui"
                    @click="updateLimit(object.id, object.quantity)">Update Limit</button>
          </template>
          <template v-slot:primary>
            <button class="btn-ui" @click="remove(object.id)">Remove</button>
          </template>
        </mall-object-row>
      </div>
      <div class="flex w-full justify-center">
        <div class="flex justify-center">
          <div class="p-1 text-right w-full" v-if="pageNum > 1">
            <button class="btn" @click="back">BACK</button>
          </div>
          <div class="p-1 w-full" v-if="totalCount - offset > limit">
            <button class="btn" @click="next">NEXT</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import MallObjectRow from "@/components/mall/MallObjectRow.vue";
import mallActions from "./mall-actions.mixin";
import { canonicalListQuery, listDefaults, readListState } from "./list-query";

export default mallActions.extend({
  name: "MallStocked",
  components: { MallObjectRow },
  data() {
    return {
      objects: [],
      loaded: false,
      totalCount: 0,
      limit: 10,
      offset: 0,
      orderBy: "DESC",
      showNext: true,
      pageNum: 1,
      pages: [],
      column: "status",
      compare: "=",
      content: 1,
    };
  },
  computed: {
    listQuery(): any {
      return canonicalListQuery(
        { page: this.pageNum, limit: this.limit, order: this.orderBy },
        listDefaults("stocked"),
      );
    },
  },
  async mounted(): Promise<void> {
    this.loaded = true;
    this.restoreListState();
    this.isMallStaff();
    this.getResults();
  },
  methods: {
    /**
     * Reads page, limit and sort back out of the URL on load or browser Back.
     *
     * Absent parameters mean "the default", which is what a canonical URL for
     * this list looks like; explicit ones are still honoured so existing links
     * keep working.
     */
    restoreListState(): void {
      const state = readListState(this.$route.query, listDefaults("stocked"));
      this.limit = state.limit;
      this.pageNum = state.page;
      this.orderBy = state.order;
      this.offset = (this.pageNum - 1) * this.limit;
    },
    syncListState(): void {
      this.$router.replace({
        path: this.$route.path,
        query: canonicalListQuery(
          { page: this.pageNum, limit: this.limit, order: this.orderBy },
          listDefaults("stocked"),
        ),
      }).catch(() => undefined);
    },
    setLimit() {
      this.offset = 0;
      this.pageNum = 1;
      this.getResults();
    },
    setPageNumber(value) {
      this.pageNum = value;
      this.offset = this.pageNum * this.limit - this.limit;
      this.getResults();
    },
    async getResults(): Promise<void> {
      this.objects = [];
      this.pages = [];
      this.syncListState();
      try {
        const response = await this.$http.get("/mall/all_objects", {
          column: this.column,
          compare: this.compare,
          content: this.content,
          limit: this.limit,
          offset: this.offset,
          orderBy: this.orderBy,
        });
        this.totalCount = response.data.objects.total[0].count;
        this.objects = response.data.objects.objects;
        this.showSuccess = true;
        const pages = Math.ceil(this.totalCount / this.limit);
        for (let i = 1; pages >= i; i++) {
          this.pages.push(i);
        }
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
      this.offset = this.pageNum * this.limit;
      this.pageNum++;
      await this.getResults();
    },
    async back() {
      this.pageNum--;
      this.offset = this.pageNum * this.limit - this.limit;
      await this.getResults();
      this.showNext = true;
    },
  },
});
</script>
