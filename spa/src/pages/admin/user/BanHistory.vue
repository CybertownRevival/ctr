<template>
  <div class="grid grid-cols-1 w-8/12 items-center justify-center">
    <div class="text-center" v-if="info.length === 0">
      This user has no bans
    </div>
    <div class="grid grid-cols-1 w-full items-center justify-center" v-else
      v-for="ban in info" :key="ban.id">
      <div class="grid grid-cols-12 border-2 border-white p-1 w-full content-center">
        <div class="text-center col-span-3 font-bold">
          Banned On
        </div>
        <div class="text-center col-span-3 font-bold">
          Ban Ends On
        </div>
        <div class="text-center col-span-3 font-bold">
          Ban Type
        </div>
        <div class="text-center col-span-3 font-bold">
          Banned By
        </div>
        <div class="text-center col-span-3">
          {{ new Date(ban.created_at)
            .toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              timeZone: "America/New_York",
            }) }}
        </div>
        <div class="text-center col-span-3">
          {{ new Date(ban.end_date)
            .toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              timeZone: "America/New_York",
            }) }}
        </div>
        <div class="text-center col-span-3">
          {{ ban.type }}
        </div>
        <div class="text-center col-span-3">
          {{ ban.username }}
        </div>
        <div class="border-t-2 border-gray-700 col-span-12">
          Reason
        </div>
        <div class="col-span-12">
          {{ ban.reason }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "UserBanHistory",
  data() {
    return {
      info: [],
    };
  },
  methods:{
    async getinfo(): Promise <void>{
      await this.$http.get(`/admin/getbanhistory/${this.$route.params.id}`)
        .then((response) => {
          this.info = response.data.banHistory;
        });
    },
  },
  async mounted() {
    await this.getinfo();
  },
});
</script>
