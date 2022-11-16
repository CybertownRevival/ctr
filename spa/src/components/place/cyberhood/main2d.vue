<template>
  <div class="text-center" v-if="loaded">
    <colony-map
      map-width="585px"
      map-height="276px"
      map-bg="/assets/img/place/cyberhood/community.jpg"
      perspective="340px"
      grid-bottom="-40px"
      rotate-x="51deg"
      scale=".76"
      skew-x="355deg"
      translate-x="21px"
      grid-width="585px"
      grid-height="276px"
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
  name: "CyberhoodMain2d",
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

