<template>
  <div class="w-full flex">
    <div class="flex flex-col w-full place-items-center">
      <div class="text-red-500" v-show="error">{{ error }}</div>
      <!--
        The dropper works from this window while the main Cybertown window
        stays in the Mall, so the outcome of a Drop has to be visible here --
        there is nowhere else they are looking.
      -->
      <div class="text-green" v-show="showSuccess && success">{{ success }}</div>
      <div class="text-center w-full text-5xl mb-1">Mall Warehouse</div>
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
        <mall-object-row v-for="object in objects"
                         :key="object.id"
                         :object="object"
                         check-from="warehouse"
                         :check-query="listQuery">
          <template v-slot:actions>
            <button class="btn-ui" @click="updateName(object.id, object.name)">Edit Name</button>
            <button class="btn-ui"
                    @click="updateLimit(object.id, object.quantity)">Update Limit</button>
            <button class="btn-ui" @click="refundUnsoldQuantity(object.id)">Destock</button>
          </template>
          <template v-slot:primary>
            <div>
              Select a Store:<br />
              <select v-model="store">
                <option v-for="option in mallStoreData" :key="option.id" :value="option.id">
                  {{ option.title }}
                </option>
              </select>
              <br /><br />
            </div>
            <button class="btn-ui" @click="drop(object.id)">Drop</button>
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
  name: "MallWarehouse",
  components: { MallObjectRow },
  data() {
    return {
      objects: [],
      loaded: false,
      totalCount: 0,
      limit: 10,
      offset: 0,
      orderBy: "ASC",
      showNext: true,
      pageNum: 1,
      pages: [],
      column: "status",
      compare: "=",
      content: 3,
      store: null,
      mallStoreData: [],
    };
  },
  computed: {
    listQuery(): any {
      return canonicalListQuery(
        { page: this.pageNum, limit: this.limit, order: this.orderBy },
        listDefaults("warehouse"),
      );
    },
  },
  async mounted(): Promise<void> {
    this.loaded = true;
    this.restoreListState();
    this.isMallStaff();
    this.getStores();
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
      const state = readListState(this.$route.query, listDefaults("warehouse"));
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
          listDefaults("warehouse"),
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
    /**
     * Called from `mounted` without being awaited, so a rejection here escapes as
     * an unhandled promise rejection and the store dropdown just stays empty --
     * staff then hit "You must select a store!" with nothing to select and no
     * indication why. The failure is reported like every other one on this page.
     */
    async getStores() {
      try {
        const stores = await this.$http.get("/mall/stores", { orderBy: "name" });
        stores.data.stores.forEach(store => {
          this.mallStoreData.push({ title: store.name, id: store.id });
        });
      } catch (errorResponse: any) {
        this.reportError(errorResponse);
      }
    },
    async refundUnsoldQuantity(objectId): Promise<void> {
      try {
        this.error = "";
        this.showError = false;
        await this.$http.post("/mall/refund", { id: objectId });
        this.success = "Object updated to deleted status.";
        this.showSuccess = true;
        this.getResults();
      } catch (errorResponse: any) {
        this.reportError(errorResponse);
      }
    },
    async drop(objectId): Promise<void> {
      this.showSuccess = false;
      this.showError = false;
      try {
        if (!this.store) {
          this.error = "You must select a store!";
          this.showError = true;
        } else {
          this.error = "";
          this.showError = false;
          await this.$http.post("/mall/drop", {
            objectId: objectId,
            shopId: this.store,
          }).then(response => {
            if (response.data.status === "success") {
              this.success = "Object dropped";
              this.showSuccess = true;
              this.store = null;
            }
          });
        }
      } catch (errorResponse: any) {
        this.reportError(errorResponse);
      } finally {
        await this.getResults();
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
