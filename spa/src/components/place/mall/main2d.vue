<template>
  <div class="text-center">
    <img src="/assets/img/place/mall/shopping.jpg" />
    <br/>
    <font face="arial" size=-1>Please select the store or shop you would like to visit from the Directory below.</font><br>
    <select
              class="text-black"
              @change="changeStore()"
              v-model="mallStore"
            >
              <option value="">Mall Directory</option>
              <option value="">-----------------------</option>
              <option v-for="option in mallStoreData" :value="option.slug">
                {{ option.title }}
              </option>
            </select>
    <br/>
    <font face="arial" size=-1>How to <a href="#">Buy and Use</a> the <b>Furniture</b> ...</font>
    <br>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "MallMain2d",
  data: () => {
    return {
      mallStoreData: [],
      mallStore: "",
    };
  },
  methods: {
    changeStore(): void {
      if(this.mallStore?.length) {
        this.$router.push({ path: `/place/${this.mallStore}`});
        this.mallStore = "";
      }
    },
    async getStores(){
      const stores = await this.$http.get("/mall/stores", {
        orderBy: "name",
      });
      stores.data.stores.forEach(store => {
        this.mallStoreData.push({
          title: store.name,
          slug: store.slug,
        });
      });
    },
  },
  mounted() {
    this.getStores();
  },
});
</script>

