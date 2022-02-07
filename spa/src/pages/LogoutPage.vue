<template>
  <div>Logging out...</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: "LogoutPage",
  data: () => {
    return {};
  },
  mounted() {
    this.$store.methods.destroySession();
    this.$router.push({ path: "/login" });
  },
});
</script>
