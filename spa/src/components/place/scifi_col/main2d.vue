<template>
  <div class="text-center" v-if="loaded">

    <div
      class="inline-block"
      :style='{
        "width": "591px",
        "height": "279px",
        "background-image": "url(\"/assets/img/place/scifi_col/community.jpg\")",
        "position": "relative"
      }'>
      <template v-for="(link,key) in links">
        <router-link :to="'/neighborhood/'+hoods.find(h => h.name === link.name).id"
                     :title="link.name"
                     :key="key"
                     class="inline-block absolute"
                     :style="{
              'width': link.width,
              'height': link.height,
              'top': link.top,
              'left': link.left,
           }">
        </router-link>
      </template>
    </div>
    <br/>
    <small>Click a neighborhood on the colony map to get your home.</small><br>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: "SciFiColMain2d",
  data: () => {
    return {
      loaded: false,
      hoods: [],
      links: [
        {
          "name": "SF Creations",
          "width": "50px",
          "height": "30px",
          "top": "135px",
          "left": "250px",
        },
        {
          "name": "SETI Institute",
          "width": "50px",
          "height": "30px",
          "top": "135px",
          "left": "370px",
        },
        {
          "name": "Legends",
          "width": "60px",
          "height": "30px",
          "top": "160px",
          "left": "305px",
        },
        {
          "name": "Supernatural",
          "width": "60px",
          "height": "30px",
          "top": "190px",
          "left": "240px",
        },
        {
          "name": "Fantasy",
          "width": "60px",
          "height": "30px",
          "top": "190px",
          "left": "365px",
        },
        {
          "name": "TechnoSphere",
          "width": "65px",
          "height": "30px",
          "top": "220px",
          "left": "300px",
        },
        {
          "name": "Aliens",
          "width": "65px",
          "height": "40px",
          "top": "220px",
          "left": "500px",
        },
      ],
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

