<template>
  <div class="text-center">
    <colony-map
      map-width="585px"
      map-height="276px"
      map-bg="/assets/img/place/campus/community.jpg"
      perspective="340px"
      grid-bottom="-28px"
      rotate-x="56deg"
      scale=".75"
      skew-x="357deg"
      translate-x="41px"
      grid-width="538px"
      grid-height="318px"
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
  name: "CampusMain2d",
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

