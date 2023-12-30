<template>
  <div>
  <button class="btn-ui"
     v-on:click="opener('#/information/'
     +$store.data.place.type
     +'/'
     +$store.data.place.id)">Information</button>
  <button class="btn-ui"
     v-on:click="opener('#/inbox/'+$store.data.place.id)">Inbox</button>
  <button class="btn-ui"
     v-on:click="opener('#/messageboard/'+$store.data.place.id)">Messages</button>
  <br />
  <div v-if="canAdmin">
    <span href="" class="btn-ui">Message to All</span>
    <span href="" class="btn-ui">Inbox to All</span>
    <span href="" class="btn-ui">Update</span>
    <router-link :to="{ name: 'worldAccessRights' }" class="btn-ui">Access Rights</router-link>
    <br />
  </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "WorldBrowserTools",
  data: () => {
    return {
      adminCheck: false,
      loaded: false,
      canAdmin: false,
      data: null,
    };
  },
  methods: {
    async checkAdmin() {
      try {
        this.adminCheck = await this.$http.get(
          `/colony/${ this.$store.data.place.id }/can_admin`);
        this.canAdmin = true;
      } catch (error) {
        this.canAdmin = false;
      }
    },
    async opener(link) {
      window.open(link, "targetWindow", "height=650,width=800,menubar=no,status=no");
    },
  },
  mounted() {
    this.checkAdmin();
  },
  watch: {
    async $route(to, from) {
      console.log("Place Change");
      await this.checkAdmin();
      this.loaded = true;
    },
  },
});
</script>
