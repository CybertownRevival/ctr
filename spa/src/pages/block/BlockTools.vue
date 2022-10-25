<template>
  <div class="text-center" v-if="loaded">
    <a class="btn-ui">Information</a>
    <a class="btn-ui">Messages</a>
    <router-link v-if="this.$store.data.place.hood"
                 :to="'/neighborhood/'+this.$store.data.place.hood.id"><img src="/assets/img/up.gif" /> {{
        this.$store.data.place.hood.name
      }}</router-link>
    <br/>
    <br/>
    <div v-if="this.$store.data.user.admin && this.$store.data.place.block">
      <a  class="btn-ui">Message to All</a>
      <a class="btn-ui">Inbox</a>
      <router-link :to="'/block/'+this.$store.data.place.block.id+'/wizard'" class="btn-ui">Update
      </router-link>
      <a class="btn-ui" title="Check Images">Check</a>
      <a class="btn-ui">Access Rights</a>
    </div>
    <br/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: "BlockTools",
  data: () => {
    return {
      loaded: false,
    };
  },
  mounted() {
    this.loaded = true;

  },
});
</script>

