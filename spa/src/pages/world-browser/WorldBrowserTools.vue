<template>
  <div>

    <button class="btn-ui"
            v-on:click="opener('#/information/'
              + $store.data.place.type
              + '/'
              + $store.data.place.id)">Information</button>
    <span v-if="$store.data.place.slug === 'employment'">
      <button class="btn-ui"
              v-on:click="opener('#/messageboard/' + $store.data.place.id)">Job Offers</button>
    </span>
    <span v-else-if="$store.data.place.type === 'shop'">
      <button class="btn-ui" v-on:click="opener(`#/inbox/${mallId.data.place.id}`)">Mall Inbox</button>
      <button class="btn-ui" v-on:click="opener(`#/messageboard/${mallId.data.place.id}`)">Mall Messages</button>
    </span>
    <span v-else>
    <button class="btn-ui"
            v-on:click="opener('#/inbox/' + $store.data.place.id)">Inbox</button>
    <button class="btn-ui"
            v-on:click="opener('#/messageboard/' + $store.data.place.id)">Messages</button>
    </span>
    <br />
    <div v-if="$store.data.place.slug === 'mall'">
      <router-link 
      :to="{ name: 'mall-upload' }"
      class="btn-ui">Upload</router-link>
      <button class="btn-ui" v-on:click="opener('#/creator/stocked')">My Uploads</button>
    </div>
    <br />
    <div v-if="canAdmin">
      <span href=""
            class="btn-ui">Message to All</span>
      <span href=""
            class="btn-ui">Inbox to All</span>
      <span href=""
            class="btn-ui">Update</span>
      <router-link :to="{ name: 'worldAccessRights' }"
                   class="btn-ui">Access Rights</router-link>
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
      mallId: null,
    };
  },
  methods: {
    async getMallId(){
      this.mallId = await this.$http.get('/place/mall')
    },
    async checkAdmin() {
      try {
        this.adminCheck = await this.$http.get(
          `/colony/${this.$store.data.place.id}/can_admin`);
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
    this.getMallId();
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
