<template>
<div class="grid grid-cols-1 w-full place-content-center">
  <div class="w-full min-w-min text-center my-2">
    <router-link class="btn-ui-inline mx-1" to="">VIEW</router-link>
    <router-link class="btn-ui-inline mx-1" to="">EDIT</router-link>
  </div>
  <div class="w-full min-w-min place-content-center">
    <router-view />
  </div>
</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "InfoMain",
});
</script>
