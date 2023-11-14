<template>
<div class="grid grid-cols-1 w-full place-content-center">
  <div class="w-full min-w-min text-5xl text-center mb-1">Citizen Information</div>
  <div class="w-full min-w-min text-center">
    <router-link class="btn-ui-inline mx-1" to="">DETAILS</router-link>
    <router-link class="btn-ui-inline mx-1" to="">CHAT MESSAGES</router-link>
    <router-link class="btn-ui-inline mx-1" to="">MESSAGES</router-link>
  </div>
  <div class="w-full min-w-min place-content-center">
    <router-view />
  </div>
</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "UserMain",
});
</script>
