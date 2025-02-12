<template>
  <div v-show="loaded">
    <div class="w-full text-center mb-4">
      <span><h3>Welcome to Club {{ $store.data.place.name }}</h3></span>
    </div>
    <div class="flex flex-row">
      <div class="w-1/3">
        <b>Description:</b><br>
        <span>{{ $store.data.place.description }}</span>
      </div>
      <div class="w-2/3 text-center">
        <img
            src="assets/img/club/comingsoon.gif"
            class="w-56 h-56"
            alt="Feature Coming Soon" />
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "ClubMain2D",
  data: () => {
    return {
      loaded: false,
    };
  },
  mounted() {
    //this.getData();
    this.loaded = true;
  },
});
</script>
