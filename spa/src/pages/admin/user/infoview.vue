<template>
<div class="grid grid-cols-8 gap-y-2">
  <div class="font-bold col-span-1">Username</div>
  <div class="col-span-7">{{info.username}}</div>
  <div class="font-bold col-span-1">Immigration Date</div>
  <div class="col-span-7">{{new Date(info.immigrationDate)
    .toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/New_York',
    })}}</div>
</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "InfoView",
  data() {
    return {
      info: null,
      // immigration_date would be defined here if needed
    };
  },
  methods:{
    async getinfo(): Promise <void>{
      await this.$http.get(`/member/info/${this.$route.params.id}`)
        .then((response) => {
          this.info = response.data.memberInfo;
        });
    },
  },
  async mounted() {
    await this.getinfo();
  },
});
</script>
