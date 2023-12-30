<template>
  <!-- archive template: property/action_standard.tmpl -->
  <div class="text-center" v-if="loaded">
    <span class="btn-ui" >Information</span>
	<button class="btn-ui"
      v-on:click="opener('#/inbox/'+$store.data.place.id)">Inbox</button>
    <button class="btn-ui"
      v-on:click="opener('#/messageboard/'+$store.data.place.id)">Messages</button>
    <router-link
      v-if="this.$store.data.place.block"
      :to="'/block/'+this.$store.data.place.block.id">
      <img src="/assets/img/up.gif" />
      {{ this.$store.data.place.block.name }}
    </router-link>
    <br/>
    <br/>
    <div v-if="this.$store.data.user.id == this.$store.data.place.member_id">
      <router-link
        :to="'/home/update'"
        class="btn-ui">
        Update
      </router-link>
    </div>
    <br/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: "HomeTools",
  data: () => {
    return {
      loaded: false,
    };
  },
  methods: {
    async opener(link) {
      window.open(link, "targetWindow", "height=650,width=800,menubar=no,status=no");
    },
  },
  mounted() {
    this.loaded = true;
  },
});
</script>

