<template>
  <div v-if="accessLevel && accessLevel.includes('admin')" class="flex-1 text-center" style="min-width: 800px;">
    <div>Mall Objects: Average Price, Top 5 priced objects, average per store</div>
    <div>User Objects: Average for sale, average price, top 5 priced objects, top 5 quantity owned</div>
  </div>
  <div v-else>
    <div class="text-5xl p-5">Access Denied</div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  name: "ObjectsPanel",
  data: () => {
    return {
    };
  },
  props: [
    "accessLevel",
  ],
  methods: {
  },
  created() {
  },
  mounted() {
  },
});
</script>
