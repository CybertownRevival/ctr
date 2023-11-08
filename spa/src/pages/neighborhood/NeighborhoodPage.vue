<template>
  <div class="h-full w-full bg-black flex flex-col">
    <router-view/>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
  
export default Vue.extend({
  name: "NeighborhoodPage",
});
</script>
