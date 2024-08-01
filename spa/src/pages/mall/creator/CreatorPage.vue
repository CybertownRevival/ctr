<template>
	<div class="w-full flex">
    <div class="flex-col w-56 border-r-2 border-white text-center">
      <br />
      <div class="mb-2"><router-link class="btn-ui" :to="{name: 'CreatorPending'}">Pending</router-link></div>
      <div class="mb-2"><router-link class="btn-ui" :to="{name: 'CreatorStocked'}">Stocked</router-link></div>
      <div class="mb-2"><router-link class="btn-ui" :to="{name: 'CreatorRestock'}">Restockable</router-link></div>
      <div class="mb-2"><router-link class="btn-ui" :to="{name: 'CreatorCatalog'}">Catalog</router-link></div>
      <br />
      <div class="mb-2"><button class="btn-ui" @click="close()">Close</button></div>
    </div>
    <div class="w-11/12 h-full p-1 overflow-y-auto"><router-view /></div>
</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "CreatorPage",
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
    close(){
      window.close();
    },
  },
	async mounted(): Promise<void> {
    this.loaded = true;
  },
});
</script>