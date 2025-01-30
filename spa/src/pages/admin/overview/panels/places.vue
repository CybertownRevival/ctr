
Original file line number	Original file line	Diff line number	Diff line change
@@ -0,0 +1,36 @@
<template>
  <div v-if="accessLevel">
    <div>Colonies: Number of neighborhoods, number of blocks, number of residence/free spots</div>
    <div v-if="accessLevel.includes('admin')">Clubs: Average owned</div>
    <div v-if="accessLevel.includes('admin')">Storage Areas: Average owned, average objects</div>
    <div v-if="accessLevel.includes('admin')">Private places</div>
  </div>
  <div v-else>
    <div class="text-5xl p-5">Access Denied</div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  name: "PlacesPanel",
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
