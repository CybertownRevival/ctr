<template>
  <div class="text-center">
    <a href="" class="btn-ui">Information</a>
    <a href="" class="btn-ui">Inbox</a>
    <a href="" class="btn-ui">Messages</a>
    <a href="" class="btn-ui">Vote</a>
    <a href=""><img src="/assets/img/up.gif" /> colony name </a>
    <br/>
    <br/>
    <a href="" class="btn-ui">Message to All</a>
    <a href="" class="btn-ui">Inbox to All</a>
    <a href="" class="btn-ui">Update</a>
    <a href="" class="btn-ui">Access Rights</a>
    <br/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: "NeighborhoodTools",
  data: () => {
    return {
      loaded: false,
    };
  },
});
</script>

