<template>
  <div>

    <button class="btn-ui"
            v-on:click="opener('#/information/'
              + $store.data.place.type
              + '/'
              + $store.data.place.id
              + '/'
              + $store.data.place.slug)">Information</button>
    <span v-if="$store.data.place.slug === 'employment'">
      <button class="btn-ui"
              v-on:click="opener('#/messageboard/' + $store.data.place.id)">Job Offers</button>
    </span>
    <span v-else-if="$store.data.place.type === 'shop'">
      <button class="btn-ui" v-on:click="opener(`#/inbox/${mallId.data.place.id}`)">
        Mall Inbox
      </button>
      <button class="btn-ui" v-on:click="opener(`#/messageboard/${mallId.data.place.id}`)">
        Mall Messages
      </button>
    </span>
    <span v-else>
    <button class="btn-ui"
            v-on:click="opener('#/inbox/' + $store.data.place.id)">Inbox</button>
    <button class="btn-ui"
            v-on:click="opener('#/messageboard/' + $store.data.place.id)">Messages</button>
    </span>
    <br />
    <div v-if="$store.data.place.slug === 'mall'">
      <button class="btn-ui" v-on:click="opener('#/mall/catalog')">Mall Catalog</button>
      <br />
      <router-link 
      :to="{ name: 'mall-upload' }"
      class="btn-ui">Upload</router-link>
      <button class="btn-ui" v-on:click="opener('#/creator/stocked')">My Uploads</button>
      <br />
    </div>
    <div v-if="canAdmin">
      <span v-if="this.$store.data.place.type === 'colony'">
        <span href=""
              class="btn-ui">Message to All</span>
        <span href=""
              class="btn-ui">Inbox to All</span>
      </span>
      <span href=""
            class="btn-ui">Update</span>
      <span v-show="$store.data.place.type !== 'shop'">
        <router-link :to="{ name: 'worldAccessRights' }"
                     class="btn-ui">Access Rights</router-link>
      </span>
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
      this.mallId = await this.$http.get('/place/mall');
    },
    async checkAdmin() {
      let endpoint;
      switch (this.$store.data.place.type) {
      case "colony":
        endpoint = `/colony/${this.$store.data.place.id}/can_admin`;
        break;
      case "public":
        endpoint = `/place/can_admin/${this.$store.data.place.slug}`;
        break;
      case "shop":
        endpoint = "/place/can_admin/mall";
        break;
      }
      try {
        const adminCheck = await this.$http.get(endpoint);
        this.canAdmin = adminCheck.data.result;
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
