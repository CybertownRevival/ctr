<template>
  <div class="text-center" v-if="loaded">
    <div :style = '{
      "width": "585px",
      "height": "276px",
      "background-image": "url(\"/assets/img/place/ent_col/community.jpg\")",
      "position": "relative",
      "border": "1px solid green",
      "perspective": "340px",
      "display": "inline-block",
    }'>
      <div style="border: 1px solid red;
      position:absolute;
      bottom:-36px;
      transform: rotateX(51deg) scale(.76) skewX(355deg) translateX(21px);
      width: 585px;
      height: 276px;
        "
           class="grid grid-cols-8 gap-0">

        <div v-for="index in 40" :key="index" style="border: 1px solid blue">
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
  name: "EntColMain2d",
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

