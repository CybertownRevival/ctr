<template>
  <div v-if="accessLevel">
    <div v-if="accessLevel.includes('security')">Chat Activity: Top 5 active places in last 10 minutes</div>
    <div v-if="accessLevel.includes('security')">Messageboard Activity: Top 5 active message boards in last 10 minutes</div>
    <div v-if="accessLevel.includes('admin')">Activity: daily, weekly, monthly</div>
    <div v-if="accessLevel.includes('security')">Chat/Posts: last 5 chat messages, last 5 message board posts, Top 5 chatters last 30 minutes</div>
    <div v-if="accessLevel.includes('security')">Money: Top 10 money(admin only), Last 10 Transactions</div>
    <div v-if="accessLevel.includes('mayor') || accessLevel.includes('security')">Banned Users: Bans last 7 days, Upcoming unbanning</div>
  </div>
  <div v-else>
    <div class="text-5xl p-5">Access Denied</div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  name: "UsersPanel",
  data: () => {
    return {
    };
  },
  props: [
    "accessLevel",
  ],
  methods: {
  },
  created() {
  },
  mounted() {
  },
});
</script>
