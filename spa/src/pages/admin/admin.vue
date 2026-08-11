<template>
  <main class="flex w-full h-full" v-if="accessLevel.length > 0 || canEditNews">
    <div class="flex-col w-56 h-full border-r-2 border-white text-center">
      <div class="pt-3">Admin Panel</div>
      <div class="p-3"><hr></div>
      <div class="mb-2" v-if="accessLevel.includes('admin')">
        <router-link class="btn-ui" :to="{name: 'AvatarSearch'}">Avatars</router-link>
      </div>
      <div class="mb-2" v-if="accessLevel.includes('admin')">
        <router-link class="btn-ui" :to="{name: 'SeizedObjects'}">Seized Objects</router-link>
      </div>
      <div class="mb-2">
        <router-link class="btn-ui" v-if="accessLevel.includes('security')" :to="{name: 'CommunityOverview'}">Overview</router-link>
      </div>
      <div class="mb-2">
        <router-link class="btn-ui" :to="{name: 'UserSearch'}">Members</router-link>
      </div>
      <div class="mb-2" v-if="accessLevel.includes('admin')">
        <router-link class="btn-ui" :to="{name: 'CityRoles'}">Roles</router-link>
      </div>
      <div class="mb-2" v-if="canEditNews">
        <router-link class="btn-ui" :to="{name: 'NewsEditor'}">News</router-link>
      </div>
      <div class="mb-2">
        <router-link class="btn-ui" :to="{name: 'PlaceSearch'}">Places</router-link>
      </div>
      <div class="mb-2" v-if="accessLevel.includes('security')">
        <router-link class="btn-ui" :to="{name: 'Transactions'}">Transactions</router-link>
      </div>
      <div class="mb-2" v-if="accessLevel.includes('admin')">
        <router-link class="btn-ui" :to="{name: 'ObjectSearch'}">Mall Objects</router-link>
      </div>
      <div class="mb-2" v-if="accessLevel.includes('security')">
        <router-link class="btn-ui" :to="{name: 'UserObjectSearch'}">User Objects</router-link>
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
      canEditNews: false,
    };
  },
  methods: {
    async getAdminLevel(): Promise<void> {
      try{
        const access = await this.$http.get("/member/getadminlevel");
        this.accessLevel = access.data.accessLevel;
      } catch (e) {
        console.log(e);
      }
    },
    async getNewsPermission(): Promise<void> {
      try {
        const response = await this.$http.get("/news/can-edit");
        this.canEditNews = response.data.canEdit;
      } catch (error) {
        console.log(error);
        this.canEditNews = false;
      }
    },
    accessCheck() {
      if (this.accessLevel.length <= 0 && !this.canEditNews){
        this.$router.push({name: "restrictedaccess"});
      }
    },
  },
  async created() {
    await this.getAdminLevel();
    await this.getNewsPermission();
    await this.accessCheck();
  },
});
</script>

