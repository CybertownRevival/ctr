<template>
  <div class="text-center" v-if="loaded">
    <colony-map
      map-width="590px"
      map-height="280px"
      map-bg="/assets/img/place/9thdimension/community.jpg"
      perspective="340px"
      grid-bottom="-26px"
      rotate-x="47deg"
      scale=".74"
      skew-x="0"
      translate-x="13px"
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
  name: "NinthDimensionMain2d",
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

