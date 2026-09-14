<template>
  <div class="w-full flex">
    <div class="flex flex-col w-full place-items-center">
      <div class="text-red-500" v-show="error">{{ error }}</div>
      <div class="text-center w-full text-5xl mb-1">Sold Out Objects</div>
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
      <div v-if="totalCount !== 0" class="grid-cols-1 w-4/6 justify-items-center text-center">
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
        <mall-object-row v-for="object in visibleObjects"
                         :key="object.id"
                         :object="object"
                         check-from="soldout"
                         :check-query="listQuery">
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

/**
 * Objects that are stocked but have nothing left to sell.
 *
 * This is a VIEW, not a stored state: an object here is also in Stocked, and the
 * overlap is intentional. The membership test below is unchanged from before -
 * including its treatment of a zero limit, which is a Mall policy question
 * rather than a display one and is reported separately.
 *
 * `/mall/soldout` returns every stocked object in one unpaginated response, so
 * sorting and paging happen here rather than in the query.
 */
export default mallActions.extend({
  name: "MallSoldOut",
  components: { MallObjectRow },
  data() {
    return {
      objects: [],
      loaded: false,
      totalCount: 0,
      limit: 10,
      offset: 0,
      orderBy: "ASC",
      pageNum: 1,
      pages: [],
    };
  },
  computed: {
    listQuery(): any {
      return canonicalListQuery(
        { page: this.pageNum, limit: this.limit, order: this.orderBy },
        listDefaults("soldout"),
      );
    },
    visibleObjects(): any[] {
      return this.objects.slice(this.offset, this.offset + this.limit);
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
      const state = readListState(this.$route.query, listDefaults("soldout"));
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
          listDefaults("soldout"),
        ),
      }).catch(() => undefined);
    },
    setLimit() {
      this.offset = 0;
      this.pageNum = 1;
      this.applyPaging();
    },
    setPageNumber(value) {
      this.pageNum = value;
      this.offset = this.pageNum * this.limit - this.limit;
      this.applyPaging();
    },
    applyPaging(): void {
      this.objects.sort((a, b) => (this.orderBy === "ASC" ? a.id - b.id : b.id - a.id));
      this.pages = [];
      const pages = Math.ceil(this.totalCount / this.limit);
      for (let i = 1; pages >= i; i++) {
        this.pages.push(i);
      }

      // Removing objects shrinks this list, and the page staff are standing on
      // can fall off the end of it -- leaving them on an empty page whose number
      // is no longer even offered in the pager, with no way back but a reload.
      // Clamping also covers a page number restored from a stale url.
      const lastPage = Math.max(pages, 1);
      if (this.pageNum > lastPage) {
        this.pageNum = lastPage;
      }
      if (this.pageNum < 1) {
        this.pageNum = 1;
      }
      this.offset = (this.pageNum - 1) * this.limit;

      // After the clamp, so the url reflects the page actually shown.
      this.syncListState();
    },
    async getResults(): Promise<void> {
      this.objects = [];
      try {
        const response = await this.$http.get("/mall/soldout");
        response.data.objects.objects.forEach(object => {
          if (
            object.instances === object.quantity
            && (object.limit === object.quantity
              || ["0", "Unlimited", null].includes(object.limit))
          ) {
            this.objects.push(object);
          }
        });
        this.totalCount = this.objects.length;
        this.applyPaging();
        this.showSuccess = true;
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
      this.pageNum++;
      this.offset = this.pageNum * this.limit - this.limit;
      this.applyPaging();
    },
    async back() {
      this.pageNum--;
      this.offset = this.pageNum * this.limit - this.limit;
      this.applyPaging();
    },
  },
});
</script>
