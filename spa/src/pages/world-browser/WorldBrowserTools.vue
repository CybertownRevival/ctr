<template>
  <a :href="'#/messageboard/' + this.$store.data.place.id" target="_blank" class="btn-ui">Messages</a>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: "WorldBrowserTools",
  data: () => {
    return {
      loaded: false,
    };
  },
});
</script>

