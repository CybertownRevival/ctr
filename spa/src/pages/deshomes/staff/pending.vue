<template>
  <div class="w-full flex">
    <div class="flex flex-col w-full place-items-center">
      <div class="text-red-500" v-show="error">{{ error }}</div>
      <div class="text-green-500" v-show="success">{{ success }}</div>
      <div class="text-center w-full text-5xl mb-1">Designer Homes Pending</div>
      <div v-if="loaded && designerHomes.length === 0">No homes waiting for approval</div>
      <div class="flex" style="margin-bottom: 2rem;" v-for="designerHome in designerHomes"
           :key="designerHome.id">
        <div class="w-full flex border">
          <div class="flex justify-center" style="min-width:250px;min-height:250px;">
            <img :src="assetUrl(designerHome, designerHome.image)"
                 style="max-width:250px;max-height:250px;height:auto;width:auto;" />
          </div>
          <div class="w-80 p-2">
            <div class="flex">
              <div class="w-24">Name: </div><div>{{ designerHome.name }}</div>
            </div>
            <div class="flex">
              <div class="w-24">Price: </div><div>{{ designerHome.price }}cc</div>
            </div>
            <div class="flex">
              <div class="w-24">Created By: </div>
              <div>{{ designerHome.username || 'Deleted User' }}</div>
            </div>
            <div class="flex">
              <div class="w-24">Uploaded: </div>
              <div>{{ new Date(designerHome.created_at).toLocaleString() }}</div>
            </div>
            <div class="flex mt-2">
              <div class="w-24">Store: </div>
              <select v-model="storeIds[designerHome.id]" class="text-black">
                <option v-for="store in stores" :key="store.id" :value="store.id">
                  {{ store.name }}
                </option>
              </select>
            </div>
          </div>
          <div class="w-40 p-2">
            <button class="btn-ui" @click="opener(designerHome, designerHome.filename)">WRL</button>
            <button class="btn-ui" @click="opener(designerHome, designerHome.image)">Image</button>
          </div>
          <div class="p-2">
            <button class="btn-ui" :disabled="isProcessing" @click="approve(designerHome.id)">
              Accept
            </button>
            <button class="btn-ui" :disabled="isProcessing" @click="reject(designerHome.id)">
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "DesignerHomesPending",
  data: () => {
    return {
      designerHomes: [],
      stores: [],
      storeIds: {},
      loaded: false,
      error: "",
      success: "",
      isProcessing: false,
    };
  },
  methods: {
    async getResults(): Promise<void> {
      try {
        const [homesResponse, storesResponse] = await Promise.all([
          this.$http.get("/designer_home/pending"),
          this.$http.get("/designer_home/stores"),
        ]);
        this.designerHomes = homesResponse.data.designerHomes;
        this.stores = storesResponse.data.stores;
        const storeIds = {};
        this.designerHomes.forEach(designerHome => {
          storeIds[designerHome.id] = designerHome.place_id;
        });
        this.storeIds = storeIds;
      } catch (errorResponse: any) {
        this.error = errorResponse.response?.data?.error ?? "An unknown error occurred";
      }
      this.loaded = true;
    },
    async approve(id): Promise<void> {
      await this.post(
        "/designer_home/approve",
        { id, storeId: this.storeIds[id] },
        "Home Approved",
      );
    },
    async reject(id): Promise<void> {
      await this.post("/designer_home/remove", { id }, "Home Rejected");
    },
    async post(endpoint, data, success): Promise<void> {
      if(this.isProcessing) return;
      this.error = "";
      this.success = "";
      this.isProcessing = true;
      try {
        await this.$http.post(endpoint, data);
        this.success = success;
        await this.getResults();
      } catch (errorResponse: any) {
        this.error = errorResponse.response?.data?.error ?? "An unknown error occurred";
      }
      this.isProcessing = false;
    },
    assetUrl(designerHome, file): string {
      return `/assets/worlds/deshomes/${designerHome.directory}/${file}`;
    },
    opener(designerHome, file) {
      window.open(
        this.assetUrl(designerHome, file),
        "targetWindow",
        "width=1000px,height=700px,location=0,menubar=0,status=0,scrollbars=0",
      );
    },
  },
  mounted() {
    this.getResults();
  },
});
</script>
