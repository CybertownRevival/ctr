<template>
  <div class="text-center">
    <span href="" class="btn-ui">Information</span>
    <span href="" class="btn-ui">Inbox</span>
    <a :href="'#/messageboard/' + this.$store.data.place.hood.id" target="_blank" class="btn-ui">Messages</a>
    <span href="" class="btn-ui">Vote</span>
    <router-link
      v-if="this.$store.data.place.colony"
      :to="'/place/'+this.$store.data.place.colony.slug">
      <img src="/assets/img/up.gif" />
      {{ this.$store.data.place.colony.name }}
    </router-link>
    <br/>
    <br/>
    <div v-if="this.$store.data.user.admin && this.$store.data.place.block">
      <span href="" class="btn-ui">Message to All</span>
      <span href="" class="btn-ui">Inbox to All</span>
      <span href="" class="btn-ui">Update</span>
      <span href="" class="btn-ui">Access Rights</span>
    </div >
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

