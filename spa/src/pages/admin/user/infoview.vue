<template>
  <div>
    <div class="w-11/12 grid grid-cols-8 gap-y-2">
      <div class="font-bold col-span-1">Username</div>
      <div class="col-span-7">{{username}}</div>
      <div class="font-bold col-span-1">Immigration Date</div>
      <div class="col-span-7">{{new Date(immigration)
        .toLocaleString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'America/New_York',
        })}}</div>
      <div class="font-bold col-span-1">First Name</div>
      <div class="col-span-7">{{firstName}}</div>
      <div class="font-bold col-span-1">Last Name</div>
      <div class="col-span-7">{{lastName}}</div>
      <div class="font-bold col-span-1" v-if="this.accessLevel.includes('admin')">Wallet Balance</div>
      <div class="col-span-7" v-if="this.accessLevel.includes('admin')">{{money}}</div>
      <div class="font-bold col-span-1">Experience Points</div>
      <div class="col-span-7">{{xp}}</div>
      <div class="font-bold col-span-1">Last Login</div>
      <div class="col-span-7">{{new Date(lastLogin)
        .toLocaleString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'America/New_York',
        })}}</div>
      <div class="font-bold col-span-1" v-if="this.accessLevel.includes('admin')">Last Role Payout</div>
      <div class="col-span-7" v-if="this.accessLevel.includes('admin')">{{new Date(lastWeeklyPayout)
        .toLocaleString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'America/New_York',
        })}}</div>
    </div>
    <div class="flex-1 w-full text-3xl" v-if="altAccounts && accessLevel.includes('security')">
      <div class="text-center p-5">Possible Other Accounts</div>
      <div>
        <div class="grid grid-cols-4 text-xl">
          <div>Username</div>
          <div>Wallet Balance</div>
          <div>Last Login</div>
          <div>Immigration Date</div>
        </div>
      </div>
      <div>
        <div class="grid grid-cols-4 text-xl">
          <div>{{  }}</div>
          <div>{{  }}</div>
          <div>{{  }}</div>
          <div>{{  }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  name: "InfoView",
  data() {
    return {
      altAccounts: null,
      username: null,
      immigration: null,
      firstName: null,
      lastName: null,
      money: 0,
      xp: 0,
      lastLogin: null,
      lastWeeklyPayout: null,
    };
  },
  props: ["accessLevel"],
  methods:{
    async getinfo(): Promise <void>{
      await this.$http.get(`/member/info/${this.$route.params.id}`)
        .then((response) => {
          const info = response.data.memberInfo;
          this.username = info.username;
          this.immigration = info.immigrationDate;
          this.firstName = info.firstName;
          this.lastName = info.lastname;
          this.money = info.walletBalance;
          this.xp = info.xp;
          this.lastLogin = info.last_daily_login_credit;
          this.lastWeeklyPayout = info.last_weekly_role_credit;
        });
    },
  },
  async created() {
    await this.getinfo();
  },
});
</script>
