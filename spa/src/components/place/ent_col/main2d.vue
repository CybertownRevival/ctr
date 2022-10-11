<template>
  <div class="text-center">
    <div
      class="inline-block"
      :style='{
        "width": "585px",
        "height": "276px",
        "background-image": "url(\"/assets/img/place/ent_col/community.jpg\")",
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
  name: "EntColMain2d",
  data: () => {
    return {
      loaded: false,
      hoods: [],
      links: [
        {
          "name": "Art",
          "width": "50px",
          "height": "27px",
          "top": "110px",
          "left": "310px",
        },
        {
          "name": "Route 66",
          "width": "50px",
          "height": "27px",
          "top": "135px",
          "left": "257px",
        },
        {
          "name": "Digital Reality",
          "width": "50px",
          "height": "27px",
          "top": "135px",
          "left": "360px",
        },
        {
          "name": "Museums",
          "width": "60px",
          "height": "27px",
          "top": "165px",
          "left": "247px",
        },
        {
          "name": "Sports",
          "width": "60px",
          "height": "27px",
          "top": "165px",
          "left": "367px",
        },
        {
          "name": "Movies",
          "width": "60px",
          "height": "37px",
          "top": "190px",
          "left": "67px",
        },
        {
          "name": "Music",
          "width": "60px",
          "height": "37px",
          "top": "190px",
          "left": "180px",
        },
        {
          "name": "Holidays",
          "width": "60px",
          "height": "37px",
          "top": "190px",
          "left": "243px",
        },
        {
          "name": "Theater",
          "width": "60px",
          "height": "37px",
          "top": "190px",
          "left": "306px",
        },
        {
          "name": "Amusement Parks",
          "width": "60px",
          "height": "37px",
          "top": "190px",
          "left": "426px",
        },
        {
          "name": "Television",
          "width": "60px",
          "height": "37px",
          "top": "225px",
          "left": "40px",
        },
        {
          "name": "Comics",
          "width": "60px",
          "height": "37px",
          "top": "225px",
          "left": "103px",
        },
        {
          "name": "Celebrities",
          "width": "60px",
          "height": "37px",
          "top": "225px",
          "left": "169px",
        },
        {
          "name": "Hallmark Entertainment Network",
          "width": "60px",
          "height": "37px",
          "top": "225px",
          "left": "369px",
        },
        {
          "name": "Literature",
          "width": "60px",
          "height": "37px",
          "top": "225px",
          "left": "510px",
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

