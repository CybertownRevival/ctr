<template>
  <div class="colonyMap" :style = '{
      "width":  mapWidth ,
      "height":  mapHeight ,
      "background-image": "url(\"" + mapBg + "\")",
      "perspective": perspective,
    }'>
    <div :style='{
      "bottom": gridBottom,
      "transform": "rotateX("+rotateX+") scale("+scale+") skewX("+skewX+") translateX("+translateX+")",
      "width": gridWidth,
      "height": gridHeight,
    }'
         class="grid grid-cols-8 gap-0 mapGrid">

      <div v-for="index in 40" :key="index">
        <template v-if="hoods.find(h => h.location === index)" >
          <router-link :to="'/neighborhood/' + hoods.find(h => h.location === index).id"
                       class="w-full h-full block text-center flex items-center justify-center">
          </router-link>
        </template>
      </div>

    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: "colonyMap",
  props: [
    "mapWidth",
    "mapHeight",
    "mapBg",
    "perspective",
    "gridBottom",
    "rotateX",
    "scale",
    "skewX",
    "translateX",
    "gridWidth",
    "gridHeight",
    "hoods",
  ],
  data: () => {
    return {
    };
  },
  methods: {
  },
  mounted() {
  },
});
</script>

