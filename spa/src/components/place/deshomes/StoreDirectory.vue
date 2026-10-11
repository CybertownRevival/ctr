<template>
  <div>
    <font face="arial" size=-1>
      Please select the store you would like to visit from the Directory below.
    </font><br>
    <select
      class="text-black"
      @change="changeStore()"
      v-model="store"
    >
      <option value="">Store Directory</option>
      <option value="">-----------------------</option>
      <option v-for="option in stores" :key="option.slug" :value="option.slug">
        {{ option.name }}
      </option>
      <option value="">-----------------------</option>
    </select>
    <br/>
    <font face="arial" size=-1>
      How to
      <router-link :to="{ name: 'deshomes-help' }">Buy and Use</router-link>
      the <b>Homes</b> ...
    </font>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "DesignerHomesStoreDirectory",
  data: () => {
    return {
      stores: [],
      store: "",
    };
  },
  methods: {
    changeStore(): void {
      if(this.store?.length) {
        this.$router.push({ path: `/place/${this.store}`});
        this.store = "";
      }
    },
    async getStores(): Promise<void> {
      const response = await this.$http.get("/designer_home/stores");
      this.stores = response.data.stores;
    },
  },
  mounted() {
    this.getStores();
  },
});
</script>
