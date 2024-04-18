<template>
	<div v-if="loaded" class="w-full flex-1 text-center p-5">
    <div class="text-center font-bold text-green" v-if="showSuccess">
      {{ this.success }}
    </div>
    <span class="text-red-500" v-if="showError">
      {{ this.error }}
    </span>
    <h3>Objects For Sale</h3>

    <div class="grid lg:grid-cols-4 md:grid-cols-3 gap-6">
      <div v-for="(object,key) in objects" :key="key">
        <img :src="'/assets/object/'+object.directory + '/' + object.image" 
          style="max-width:250px;max-height:250px;height:auto;width:auto;"
        />
        <div>{{ object.name }}</div>
        <div>Price: {{ object.price }}cc</div>
        <div>Quantity Available: {{ object.quantity - object.instances}}</div>
        <button type="button" class="btn-ui" @click="buy(object.id)" v-if="(object.quantity > object.instances)">Buy</button>
        <button type="button" v-else disabled>Sold Out</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "MallShopPage",
  data: () => {
    return {
      canAdmin: false,
      objects: [],
      showError: false,
      error: '',
      success: '',
      showSuccess: false,
      loaded: false,
    };
  },
  methods: {
    async getResults(): Promise<void> {
      try {
        const response = await this.$http.get("/mall/for_sale");
        this.objects = response.data.objects;
        this.showSuccess = true;
      } catch (errorResponse: any) {
        if (errorResponse.response.data.error) {
          this.error = errorResponse.response.data.error;
          this.showError = true;
        } else {
          this.error = "An unknown error occurred";
          this.showError = true;
        }
      }
    },
    async buy(objectId) {
      this.showSuccess = false;
      this.showError = false;
      try {
        await this.$http.post("/mall/buy", {
          'id': objectId
        });
        this.success = 'Object Purchased!';
        this.showSuccess = true;
        this.getResults();
      } catch (errorResponse: any) {
        if (errorResponse.response.data.error) {
          this.error = errorResponse.response.data.error;
          this.showError = true;
        } else {
          this.error = "An unknown error occurred";
          this.showError = true;
        }
      }

    }
  },
	async mounted(): Promise<void> {
    this.loaded = true;
    this.getResults();
  },
  watch: {
  },
});
</script>
