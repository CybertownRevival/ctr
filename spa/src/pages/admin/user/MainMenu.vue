<template>
<div class="grid grid-cols-1 w-full place-content-center">
  <div class="w-full min-w-min text-5xl text-center mb-1">Citizen Information</div>
  <div class="w-full min-w-min text-center">
    <router-link class="btn-ui-inline mx-1 w-32" :to="{name: 'UserView'}">DETAILS</router-link>
    <router-link class="btn-ui-inline mx-1 w-32"
     v-if="accessLevel.includes('security')"
     :to="{name: 'UserChat'}">CHAT HISTORY</router-link>
    <router-link class="btn-ui-inline mx-1 w-32" :to="{name: 'UserBanHistory'}">BAN</router-link>
    <router-link class="btn-ui-inline mx-1 w-32"
     :to="{name: 'UserCurrentRoles'}">ROLES</router-link>
    <router-link class="btn-ui-inline mx-1 w-32"
     :to="{name: 'UserDonor'}"
     v-if="accessLevel.includes('admin')">DONOR</router-link>
  </div>
  <div class="w-full min-w-min place-content-center">
    <router-view :accessLevel="accessLevel" />
  </div>
</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "UserMain",
  props: [
    "accessLevel",
  ],
});
</script>
