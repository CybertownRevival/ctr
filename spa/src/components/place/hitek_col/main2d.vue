<template>
  <div class="text-center" v-if="loaded">
    <colony-map
      map-width="591px"
      map-height="279px"
      map-bg="/assets/img/place/hitek_col/community.jpg"
      perspective="340px"
      grid-bottom="-9px"
      rotate-x="47deg"
      scale=".70"
      skew-x="357deg"
      translate-x="40px"
      grid-width="590px"
      grid-height="310px"
      :hoods="hoods"
    ></colony-map>
    <br/>
    <small>Click a neighborhood on the colony map to get your home.</small><br>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import colonyMap from "@/components/place/colonyMap.vue";

export default Vue.extend({
  name: "HiTekMain2d",
  components: {colonyMap},
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

