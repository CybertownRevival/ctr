<template>
  <div v-if="accessLevel && accessLevel.includes('admin')" class="flex-1 text-center" style="min-width: 800px;">
    <div>Average Money</div>
    <div>Average Objects Owned</div>
    <div>Average Mall Object Price</div>
    <div>Average User Object Price</div>
  </div>
  <div v-else>
    <div class="text-5xl p-5">Access Denied</div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  name: "EconomicPanel",
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
