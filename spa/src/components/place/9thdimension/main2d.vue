<template>
  <div class="text-center" v-if="loaded">
    <div :style = '{
      "width": "590px",
      "height": "280px",
      "background-image": "url(\"/assets/img/place/9thdimension/community.jpg\")",
      "position": "relative",
      "border": "1px solid green",
      "perspective": "340px",
      "display": "inline-block",
    }'>
      <div style="border: 1px solid red;
      position:absolute;
      bottom:-26px;
      transform: rotateX(47deg) scale(0.74) skewX(0) translateX(13px);
      width: 590px;
      height: 310px;
        "
           class="grid grid-cols-8 gap-0">

        <div v-for="index in 40" :key="index" style="border: 1px solid yellow">
          <template v-if="hoods.find(h => h.location === index)" >
            <router-link :to="'/neighborhood/' + hoods.find(h => h.location === index).id"
                         class="w-full h-full block text-center flex items-center justify-center">
            </router-link>
          </template>
        </div>

      </div>
    </div>
    <br/>
    <small>Click a neighborhood on the colony map to get your home.</small><br>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: "NinthDimensionMain2d",
  data: () => {
    return {
      loaded: false,
      hoods: [],
    };
  },
  methods: {
    getData() {
      this.$http.get("/colony/" + this.$route.params.id + "/hoods")
        .then(response => {
          this.hoods = response.data.hoods;
          this.loaded = true;
        });
    },
  },
  mounted() {
    this.getData();
  },
});
</script>

