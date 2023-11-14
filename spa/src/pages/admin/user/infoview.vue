<template>
<div class="grid grid-cols-8 gap-y-2">
  <div class="font-bold col-span-1">Username</div>
  <div class="col-span-7">{username}............................................................</div>
  <div class="font-bold col-span-1">Immigration Date</div>
  <div class="col-span-7">{immigration_date}</div>
</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "InfoView",
});
</script>
