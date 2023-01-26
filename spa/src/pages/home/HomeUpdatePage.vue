<template>
  <div class="h-full w-full bg-black flex flex-col p-2" v-if="loaded">
    <!-- todo goes to property/update.tmpl which has more subpages -->
    home update page


    3 links:
    * Update home
    * Information
    * Image
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { colonyDataHelper, homeDataHelper } from "@/helpers";

export default Vue.extend({
  name: "HomeUpdatePage",
  data: () => {
    return {
      loaded: true,
    };
  },
  methods: {
  },
  mounted() {
  },
});
</script>
