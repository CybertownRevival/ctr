<template>
  <div>

    <button class="btn-ui"
            v-on:click="opener('#/information/'
              + $store.data.place.type
              + '/'
              + $store.data.place.id
              + '/'
              + $store.data.place.slug)">Information</button>
    <span>
    <button class="btn-ui"
            v-on:click="opener('#/inbox/' + $store.data.place.id)">Inbox</button>
    <button class="btn-ui"
            v-on:click="opener('#/messageboard/' + $store.data.place.id)">Messages</button>
    <button class="btn-ui"
            v-on:click="opener('#/memberlist/' + $store.data.place.id)">Members</button>
    </span>
    <br />
    <div v-if="canAdmin">
      <span href=""
            class="btn-ui">Update</span>
      <span>
        <router-link :to="{ name: 'clubAccessRights' }"
                     class="btn-ui">Access Rights</router-link>
      </span>
      <br />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "ClubTools",
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
    async checkAdmin() {
      try {
        const adminCheck = await this.$http
          .get(`/place/can_admin/${this.$store.data.place.slug}/${this.$store.data.place.id}`);
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
