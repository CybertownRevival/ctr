<template>
  <div v-if="accessLevel && accessLevel.includes('admin')">
    <div>Mall Objects: Top 5 priced objects, Top 5 quantities</div>
    <div>User Objects: top 5 priced objects, top 5 quantity owned</div>
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
