<template>
  <div class="flex flex-wrap gap-10 p-5" v-if="accessLevel && accessLevel.includes('admin')">
    <div class="px-5 pt-2 border rounded-lg w-96">
      <div class="text-2xl underline font-bold">Members Overview</div>
      <div class="p-2">
        <div>Members: {{ Number(totalUsers).toLocaleString() }}</div>
        <div>Jailed Members: {{ Number(totalJailedUsers).toLocaleString() }}</div>
        <div>Banned Members: {{ Number(totalBannedUsers).toLocaleString() }}</div>
      </div>
    </div>
    <div class="px-5 pt-2 border rounded-lg w-96">
      <div class="text-2xl underline font-bold">Money Overview</div>
      <div class="p-2">
        <div>Average Balance: {{ Number(averageMoney).toLocaleString() }} cc</div>
        <div>Highest Balance: {{ Number(highestMoney).toLocaleString() }} cc</div>
        <div>Community Balance: {{ Number(totalMoney).toLocaleString() }} cc</div>
      </div>
    </div>
    <div class="px-5 pt-2 border rounded-lg w-96">
      <div class="text-2xl underline font-bold">Owned Objects Overview</div>
      <div class="p-2">
        <div>Average Objects Owned: {{ Number(averageObjects).toLocaleString() }}</div>
        <div>Highest Amount Owned: {{ Number(highestObjects).toLocaleString() }}</div>
        <div>Total Owned Objects: {{ Number(totalObjects).toLocaleString() }}</div>
      </div>
    </div>
    <div class="px-5 pt-2 border rounded-lg w-96">
      <div class="text-2xl underline font-bold">Priced Objects Overview</div>
      <div class="p-2">
        <div>Total For Sale: {{ Number(totalObjectsForSale).toLocaleString() }}</div>
        <div>Average Price: {{ Number(averagePriceForSale).toLocaleString() }} cc</div>
        <div>Highest Price: {{ Number(highestPriceForSale).toLocaleString() }} cc</div>
      </div>
    </div>
    <div class="px-5 pt-2 border rounded-lg w-96">
      <div class="text-2xl underline font-bold">Mall Overview</div>
      <div class="p-2">
        <div>Total Objects Uploaded: {{ Number(totalUploads).toLocaleString() }}</div>
        <div>Average Mall Object Price: {{ Number(averageMallPrice).toLocaleString() }} cc</div>
      </div>
    </div>
  </div>
  <div v-else>
    <div class="text-5xl p-5">Access Denied</div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  name: "EconomicPanel",
  data: () => {
    return {
      averageMoney: 0,
      averageObjects: 0,
      averageMallPrice: 0,
      averagePriceForSale: 0,
      highestMoney: 0,
      highestObjects: 0,
      highestPriceForSale: 0,
      totalUsers: 0,
      totalMoney: 0,
      totalUploads: 0,
      totalObjects: 0,
      totalObjectsForSale: 0,
      totalBannedUsers: 0,
      totalJailedUsers: 0,
      walletData: [],
    };
  },
  props: [
    "accessLevel",
  ],
  methods: {
    async getMoney() {
      await this.$http.get('/admin/money-data').then((response) => {
        this.walletData = response.data.results;
        this.getTotalMoney();
        this.getAverageMoney();
        this.getHighestMoney();
      })
    },
    getTotalMoney() {
      this.walletData.forEach((res) => {
        this.totalMoney = this.totalMoney + res.balance;
      });
    },
    getAverageMoney() {
      this.averageMoney = this.totalMoney / this.walletData.length;
    },
    getHighestMoney() {
      this.walletData.forEach((res) => {
        if(this.highestMoney < res.balance){
          this.highestMoney = res.balance
        };
      })
    },
    async getMembers() {
      await this.$http.get('/admin/member-data').then((response) => {
        this.totalUsers = response.data.results.members[0].count;
        this.totalBannedUsers = response.data.results.banned;
        this.totalJailedUsers = response.data.results.jailed;
      })
    },
    async getObjects() {

    },
    async getMall() {

    },
  },
  created() {
    this.getMoney();
    this.getMembers();
    this.getObjects();
    this.getMall();
  },
  mounted() {
  },
});
</script>
