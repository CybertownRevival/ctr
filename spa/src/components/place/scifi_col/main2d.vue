<template>
  <div class="text-center" v-if="loaded">
    <colony-map
      map-width="591px"
      map-height="279px"
      map-bg="/assets/img/place/scifi_col/community.jpg"
      perspective="800px"
      grid-bottom="-37px"
      rotate-x="56deg"
      scale=".82"
      skew-x="-2deg"
      translate-x="7px"
      grid-width="591px"
      grid-height="279px"
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
  name: "SciFiColMain2d",
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

