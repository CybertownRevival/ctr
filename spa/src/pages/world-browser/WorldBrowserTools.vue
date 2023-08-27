<template>
  <a :href="'#/messageboard/' + this.$store.data.place.id"
     target="_blank" class="btn-ui">Messages</a>
  <br />
  <br />
  <div v-if="canAdmin && this.$store.data.place.colony">
    <span href="" class="btn-ui">Message to All</span>
    <span href="" class="btn-ui">Inbox to All</span>
    <span href="" class="btn-ui">Update</span>
    <router-link :to="{ name: 'worldaccessrights' }" class="btn-ui">Access Rights</router-link>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "WorldBrowserTools",
  data: () => {
    return {
      loaded: false,
      canAdmin: false,
    };
  },
  methods: {
    async checkAdmin(): Promise<boolean> {
      let endpoint = null;
      switch (this.$store.data.place.type) {
      case "colony":
        endpoint =
              `/colony/${
                this.$store.data.place.id
              }/can_admin`;
        break;
      default:
        break;
      }
      try {
        await this.$http.get(endpoint);
        this.canAdmin = true;
      } catch (error) {
        this.canAdmin = false;
        return;
      }
    },
  },
  mounted() {
    this.checkAdmin();
  },
  watch: {
    "$store.data.place.type": {
      handler() {
        if (this.$store.data.place.colony) {
          this.loaded = true;
          this.checkAdmin();
        }
      },
    },
  },
});
</script>

