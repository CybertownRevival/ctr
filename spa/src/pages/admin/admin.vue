<template>
<main class="flex w-full h-full">
  <div class="flex-col w-56 h-full border-r-2 border-white text-center">
    <div class="pt-3">Admin Panel</div>
    <div class="p-3"><hr></div>
    <div class="mb-2">
      <router-link class="btn-ui" :to="{name: 'UserSearch'}">Members</router-link>
    </div>
    <div class="mb-2">
      <router-link class="btn-ui" :to="{name: 'PlaceSearch'}">Places</router-link>
    </div>
    <div class="mb-2" v-if="accessLevel.includes('admin')">
      <router-link class="btn-ui" :to="{name: 'AvatarSearch'}">Avatars</router-link>
    </div>
  </div>
  <div class="w-11/12 h-full p-1 overflow-y-scroll"><router-view :accessLevel="accessLevel" /></div>
</main>
</template>
<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "admin",
  data: () => {
    return {
      accessLevel: [],
    };
  },
  methods: {
    async getAdminLevel(): Promise<void> {
      try{
        const access = await this.$http.get("/member/getadminlevel");
        this.accessLevel = access.data.accessLevel;
        this.accessCheck();
      } catch (e) {
        console.log(e);
      }
    },
    accessCheck() {
      if (this.accessLevel.length <= 0){
        this.$router.push({name: "restrictedaccess"});
      }
    },
  },
  created() {
    this.getAdminLevel();
  },
});
</script>
