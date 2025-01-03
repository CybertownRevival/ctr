<template>
<div class="grid grid-cols-1 w-full place-content-center">
  <div class="w-full min-w-min text-center my-2"
       v-if="isUserDetailRoute">
    <router-link class="btn-ui-inline mx-1 w-20" to="">VIEW</router-link>
  </div>
    <div class="w-full min-w-min text-center my-2"
         v-else-if="isUserBanRoute">
      <router-link
       class="btn-ui-inline mx-1 w-20"
       :to="{name: 'UserBanHistory'}">HISTORY</router-link>
       <router-link
          class="btn-ui-inline mx-1 w-20"
          :to="{name: 'UserBanAdd'}"
          v-if="accessLevel.includes('security')">ADD</router-link>
    </div>
    <div class="w-full min-w-min text-center my-2"
     v-else-if="isUserRoleRoute && accessLevel.includes('council')">
      <router-link class="btn-ui-inline mx-1 w-24"
       :to="{name: 'UserCurrentRoles'}">CURRENT</router-link>
      <router-link
        v-if="accessLevel.includes('mayor')"
        class="btn-ui-inline mx-1 w-24"
        :to="{name: 'UserHireRoles'}">HIRE</router-link>
      <router-link v-if="accessLevel.includes('mayor')" class="btn-ui-inline mx-1 w-24"
       :to="{name: 'UserFireRoles'}">TERMINATE</router-link>
    </div>
    <div class="w-full min-w-min text-center my-2"
         v-else/>
  <div class="flex w-full min-w-min items-center justify-center">
    <router-view :accessLevel="accessLevel" />
  </div>
</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "UserSubMenu",
  props: ["accessLevel"],
  computed: {
    isUserDetailRoute(): boolean {
      return this.$route.name === "UserView" || this.$route.name === "UserEdit";
    },
    isUserBanRoute(): boolean {
      return this.$route.name === "UserBanHistory" || this.$route.name === "UserBanAdd";
    },
    isUserRoleRoute(): boolean {
      return this.$route.name === "UserHireRoles" || this.$route.name === "UserCurrentRoles" || this.$route.name === "UserFireRoles";
    },
  },
});
</script>
