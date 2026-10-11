<template>
  <div class="text-center p-4">
    <h1 class="text-3xl font-bold mb-3">Designer Homes</h1>
    <store-directory />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import StoreDirectory from "./StoreDirectory.vue";

export default Vue.extend({
  name: "DesignerHomesMain2d",
  components: {
    StoreDirectory,
  },
});
</script>
