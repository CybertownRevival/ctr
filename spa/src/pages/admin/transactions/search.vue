<template>
  <div class="flex-1">
    <div class="flex w-full justify-center p-5">
      <h1>
        Transaction History
      </h1>
    </div>
    <div class="grid grid-cols-3 w-full justify-items-center">
    <div>
      Transaction Type: 
      <select v-model="type" @change="getTransactions">
        <option value="daily-credit">Daily Credit</option>
        <option value="home-purchase">Home Purchases</option>
        <option value="home-refund">Home Refund</option>
        <option value="object-sell">User Object Sells</option>
        <option value="object-upload">Mall Object Uploads</option>
        <option value="object-upload-refund">Mall Reject Refunds</option>
        <option value="object-restock">Mall Object Restock</option>
        <option value="object-unsold-instances-refund">Mall Unsold Refunds</option>
        <option value="object-purchase">Mall Purchase</option>
        <option value="object-profit">Mall Sold</option>
      </select>
    </div>
    <div></div>
    <div>
      View Amount:
      <select v-model.number="limit" @change="getTransactions">
        <option value=10>10</option>
        <option value=20>20</option>
        <option value=50>50</option>
        <option value=100>100</option>
      </select>
    </div>
  </div>
  <div class="flex w-full justify-center">
    Total: {{ totalCount }}
  </div>
    <div class="flex w-full justify-center p-5">
      <table>
        <tr>
          <th>ID</th>
          <th></th>
          <th>Amount</th>
          <th>Date</th>
          <th>Reason</th>
          <th></th>
        </tr>
        <tr class="border" v-for="transaction in finalTransactions" :key="transaction.id">
          <td class="p-5 font-bold">{{ transaction.id }}</td>
          <td class="p-5">
            <table>
              <tr>
                <td class="italic pb-2" v-if="transaction.sender[0].username !== 'System'">Buyer: </td>
                <td class="italic pb-2" v-else>Sender: </td>
                <td class="text-center text-green font-bold px-2 pb-2">{{ transaction.sender[0].username }}</td>
              </tr>
              <tr>
                <td class="italic" v-if="transaction.sender[0].username !== 'System'">Seller: </td>
                <td class="italic" v-else>Receiver: </td>
                <td class="text-center text-green font-bold px-2">{{ transaction.receiver[0].username }}</td>
              </tr>
            </table>
          </td>
          <td class="p-5 text-center">{{ transaction.amount }} cc</td>
          <td class="p-5 text-center">{{ new Date(transaction.created_at).toLocaleTimeString("en-US", {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            timeZone: 'America/New_York',}) }}
          </td>
          <td class="p-5 text-center">{{ reasonDisplay[transaction.reason_display] }}</td>
        </tr>
      </table>
    </div>
    <div class="grid grid-cols-2 w-full justify-items-center">
        <div class="p-1 text-right w-full">
          <button
              class="bg-gray-300 text-black p-2"
              @click="back"
              v-show="offset != 0">
            BACK
          </button>
        </div>
        <div class="p-1 text-left w-full">
          <button
              class="bg-gray-300 text-black p-2"
              @click="next"
              v-show="offset + limit <= totalCount">
            NEXT
          </button>
        </div>
      </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  name: "Transactions",
  data: () => {
    return {
      accessLevel: null,
      totalCount: 0,
      userTransactions: [],
      finalTransactions: [],
      limit: 10,
      offset: 0,
      showNext: true,
      error: null,
      user: null,
      type: "object-sell",
      reasonDisplay: [
        'Daily Credit',
        'Home Purchase',
        'Home Refund',
        'User Object Sells', 
        'Mall Object Upload',
        'Mall Reject Refund',
        'Mall Object Restock',
        'Mall Unsold Refund',
        'Mall Purchase',
        'Mall Sold',
      ],
      reasons: [
        'daily-credit',
        'home-purchase',
        'home-refund',
        'object-sell', 
        'object-upload',
        'object-upload-refund',
        'object-restock',
        'object-unsold-instance-refund',
        'object-purchase',
        'object-profit',
      ],
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
      if (!this.accessLevel.includes('security')){
        this.$router.push({name: "restrictedaccess"});
      }
    },
    async getTransactions() {
      this.userTransactions = [];
      this.finalTransactions = [];
      this.totalCount = 0;
      await this.$http.get('/admin/transactions', {
        type: this.type,
        limit: this.limit,
        offset: this.offset,
      }).then((result) => {
        this.userTransactions = result.data.returnResults[0];
        this.totalCount = result.data.returnResults[1][0].count;
      });
      this.userTransactions.forEach((result) => {
        const index = this.reasons.indexOf(result.reason);
        result.reason_display = index;
        this.finalTransactions.push(result);
      })
    },
    async next() {
      this.offset = this.offset + this.limit;
      await this.getTransactions();
    },
    async back() {
      this.offset = this.offset - this.limit;
      await this.getTransactions();
      this.showNext = true;
    },
  },
  created() {
    this.getAdminLevel();
  },
  mounted() {
    this.getTransactions();
  },
});
</script>
