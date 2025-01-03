<template>
  <div class="w-11/12 grid grid-cols-8 gap-y-2">
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
    <div class="font-bold col-span-1">First Name</div>
    <div class="col-span-7">{{info.firstname}}</div>
    <div class="font-bold col-span-1">Last Name</div>
    <div class="col-span-7">{{info.lastname}}</div>
    <div class="font-bold col-span-1" v-if="this.accessLevel.includes('admin')">Wallet Balance</div>
    <div class="col-span-7" v-if="this.accessLevel.includes('admin')">{{info.walletBalance}}</div>
    <div class="font-bold col-span-1">Experience Points</div>
    <div class="col-span-7">{{info.xp}}</div>
    <div class="font-bold col-span-1">Last Login</div>
    <div class="col-span-7">{{new Date(info.last_daily_login_credit)
      .toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'America/New_York',
      })}}</div>
    <div class="font-bold col-span-1" v-if="this.accessLevel.includes('admin')">Last Role Payout</div>
    <div class="col-span-7" v-if="this.accessLevel.includes('admin')">{{new Date(info.last_weekly_role_credit)
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
      };
    },
    props: ["accessLevel"],
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
  