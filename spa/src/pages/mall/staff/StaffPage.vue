<template>
  <div v-if="!canAdmin" class="w-full flex h-full justify-center"><div class="text-red-500">{{ error }}</div></div>
	<div v-else class="w-full flex">
    <div class="flex-col w-56 border-r-2 border-white text-center">
      <br />
      <div class="mb-2"><router-link class="btn-ui" :to="{name: 'MallWarehouse'}">Warehouse</router-link></div>
      <div class="mb-2"><router-link class="btn-ui" :to="{name: 'MallPending'}">Pending</router-link></div>
      <div class="mb-2"><router-link class="btn-ui" :to="{name: 'MallStocked'}">Stocked</router-link></div>
      <div class="mb-2"><router-link class="btn-ui" :to="{name: 'MallSoldOut'}">Out of Stock</router-link></div>
      <div class="mb-2"><router-link class="btn-ui" :to="{name: 'MallObjectSearch'}">Search</router-link></div>
      <br />
      <div class="mb-2"><router-link class="btn-ui" :to="{path: '/place/mall'}">Return to Mall</router-link></div>
    </div>
    <div class="w-11/12 h-full p-1 overflow-y-auto"><router-view /></div>
</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "MallStaffPage",
  data: () => {
    return {
      canAdmin: false,
      showError: false,
      error: '',
      success: '',
      showSuccess: false,
      loaded: false,
    };
  },
  methods: {
    async isMallStaff() {
      try {
        await this.$http.get(
          `/mall/can_admin`,
        );
        this.canAdmin = true;
      } catch (e) {
        console.log(e);
        this.error = 'Access Denied!'
      }
    },
  
  },
	async mounted(): Promise<void> {
    this.loaded = true;
    this.isMallStaff();
  },
});
</script>
