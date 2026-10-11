<template>
  <div class="h-full overflow-y-auto p-4">
    <div class="text-center">
      <h1 class="text-3xl font-bold mb-1">{{ $store.data.place.name }}</h1>
      <font face="arial" size=-1>
        <router-link :to="{ path: '/place/deshomes' }">Return To Designer Homes</router-link>
      </font>
      <br/>
      <store-directory />
    </div>

    <div class="text-center text-red-500 mt-3" v-show="error">{{ error }}</div>
    <div class="text-center text-green-500 mt-3" v-show="success">
      {{ success }}
      <router-link :to="{ name: 'home-update-home' }">Update your home</router-link> to move in.
    </div>

    <div v-if="loaded && designerHomes.length === 0" class="text-center mt-5">
      There are no homes for sale in this store yet.
    </div>
    <div class="flex flex-wrap justify-center mt-5">
      <div
        v-for="designerHome in designerHomes"
        :key="designerHome.id"
        class="w-64 m-2 p-2 border border-white text-center"
      >
        <div class="flex justify-center items-center" style="height:200px;">
          <img
            :src="`/assets/worlds/deshomes/${designerHome.directory}/${designerHome.image}`"
            style="max-width:240px;max-height:200px;"
          />
        </div>
        <div class="font-bold mt-2">{{ designerHome.name }}</div>
        <div>by {{ designerHome.username || 'Deleted User' }}</div>
        <div>Price: <strong>{{ designerHome.price }}cc</strong></div>
        <div class="mt-2">
          <span v-if="designerHome.owned" class="text-green-500">Owned</span>
          <button
            v-else
            class="btn-ui"
            :disabled="isProcessing"
            @click="buy(designerHome)"
          >Buy</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import StoreDirectory from "../deshomes/StoreDirectory.vue";

export default Vue.extend({
  name: "DesignerHomeShopMain2d",
  components: {
    StoreDirectory,
  },
  data: () => {
    return {
      designerHomes: [],
      loaded: false,
      error: "",
      success: "",
      isProcessing: false,
    };
  },
  methods: {
    async getHomes(): Promise<void> {
      this.loaded = false;
      try {
        const response = await this.$http.get(`/designer_home/store/${this.$store.data.place.id}`);
        this.designerHomes = response.data.designerHomes;
      } catch (errorResponse: any) {
        this.error = errorResponse.response?.data?.error ?? "An unknown error occurred";
      }
      this.loaded = true;
    },
    async buy(designerHome): Promise<void> {
      if(this.isProcessing) return;
      if(!confirm(`Buy ${designerHome.name} for ${designerHome.price}cc?`)) return;

      this.error = "";
      this.success = "";
      this.isProcessing = true;
      try {
        await this.$http.post("/designer_home/buy", { id: designerHome.id });
        this.success = `You now own ${designerHome.name}!`;
        await this.getHomes();
      } catch (errorResponse: any) {
        this.error = errorResponse.response?.data?.error ?? "An unknown error occurred";
      }
      this.isProcessing = false;
    },
  },
  mounted() {
    this.getHomes();
  },
  watch: {
    "$store.data.place.id"() {
      this.success = "";
      this.error = "";
      this.getHomes();
    },
  },
});
</script>
