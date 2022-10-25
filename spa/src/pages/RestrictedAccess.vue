<template>
  <div class="h-full w-full bg-black flex flex-col">
    <div class="w-full flex-1 text-center">
      <h1>Restricted Access</h1>
      <p>You do not have permission to access this page.</p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "RestrictedAccessPage",
  data: () => {
    return {
    };
  },
});
</script>
