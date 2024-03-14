<template>
  <div class="text-center">
    <img src="/assets/img/place/employment/employment.jpg" usemap="#image-map" />
    <map name="image-map">
      <area
        class="cursor-pointer"
        alt="Job Offers"
        title="Job Offers"
        @click="opener('#/messageboard/' + $store.data.place.id)"
        coords="-1,157,94,217"
        shape="rect">
    </map>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: "EmploymentMain2d",
  data: () => {
    return {};
  },
  methods: {
    async opener(link) {
      window.open(link, "targetWindow", "height=650,width=800,menubar=no,status=no");
    },
  },
});
</script>

