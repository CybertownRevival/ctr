<template>
  <div class="h-full w-full bg-black flex flex-col" v-if="loaded">
    <div
      style="position:relative;border: 1px solid green;perspective: 500px;width: 570px;height:250px;margin: 50px auto 0
    auto;">
      <div style="border: 1px solid red;
      position:absolute;
      left:0;
      right:0;
      bottom:0;
        transform: rotateX(45deg);"
           class="grid grid-cols-8 gap-0">

        <div v-for="index in 40" :key="index" style="border: 1px solid blue">{{ index }}</div>

      </div>
    </div>
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
