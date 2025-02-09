<template>
  <div class="text-center">
    <img src="/assets/img/place/clubdir/clubdir.jpg" style="width: 450px;"
    class="mb-2"/>
    <br>
    <router-link class="btn-ui-inline mx-2" :to="{name: 'club-directory'}">CLUBS LIST</router-link>
    <router-link class="btn-ui-inline mx-2" :to="{name: 'create-club'}">CREATE A CLUB</router-link>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "ClubDirMain2d",
  data: () => {
    return {};
  },
});
</script>

