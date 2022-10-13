<template>
  <div class="h-full w-full bg-black flex flex-col" v-if="loaded">
    todo
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { BlockData } from "./block-data.interface";
//import { colonyDataHelper } from '@/helpers';

export default Vue.extend({
  name: "BlockPage",
  data: (): BlockData => {
    return {
      loaded: true,
    };
  },
  methods: {
  },
  watch: {
  },
  mounted() {
  },
  async beforeDestroy() {
  },
});
</script>
