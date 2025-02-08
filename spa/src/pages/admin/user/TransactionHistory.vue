<template>
  <div>
    <div class="grid grid-cols-3">
      <div class="flex w-full justify-center">
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
      <div></div>
      <div class="text-2xl">Transaction History</div>
      <div></div>
    </div>
    
    <div>
      <table>
        <tr>
          <th></th>
          <th>Amount</th>
          <th>Date</th>
          <th>Reason</th>
          <th></th>
        </tr>
        <tr class="border" v-for="transaction in transactions" :key="transaction.id">
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
          <td class="p-5 text-center">{{ formatReason(transaction.reason) }}</td>
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
  name: "TransactionHistory",
  data: () => {
    return {
      transactions: [],
      limit: 10,
      offset: 0,
      showNext: false,
      totalCount: 0,
      reasonDisplay: [
        'Daily Credit',
        'Home Purchase',
        'Home Refund',
        'User Object Sells', 
        'Mall Object Upload',
        'Mall Reject Refund',
        'Mall Object Restock',
        'Mall Unsold Refund',
        'Mall Item Purchase',
        'Mall Item Sold',
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
    async getTransactions() {
      const results = await this.$http.get(`/admin/transactions/${this.$route.params.id}`, {
        limit: this.limit,
        offset: this.offset,
      })
      console.log(results.data.results);
      this.transactions = results.data.results.transactions;
      this.totalCount = results.data.results.total[0].count
    },
    formatReason(data) {
      const index = this.reasons.indexOf(data);
      if(index === -1) {
        return "Weekly Role Credit";
      } else {
        return this.reasonDisplay[index];
      }
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
    this.getTransactions();
  },
  mounted() {
  },
});
</script>
