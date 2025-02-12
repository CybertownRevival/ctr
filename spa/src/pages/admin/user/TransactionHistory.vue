<template>
  <div>
    <div v-if="transactions.length >= 1" class="grid grid-cols-3 w-full">
      <div></div>
      <div></div>
      <div>
        View Amount:
        <select v-model.number="limit" @change="setLimit">
          <option value=10>10</option>
          <option value=20>20</option>
          <option value=50>50</option>
          <option value=100>100</option>
        </select>
      </div>
    </div>
    <div v-if="transactions.length >= 1" class="mt-5 grid-cols-1 w-full justify-items-center text-center ">
      Total Count: {{ totalCount }}
    </div>
    <span v-if="pages.length > 1" class="flex w-full justify-center font-bold">Pages</span>
    <div v-if="pages.length > 1" class="flex w-full justify-center font-bold">
      <span class="flex justify-center" v-for="page in pages" :value="page">
        <span class="p-2" v-if="pageNum === page">{{ page }}</span>
        <span class="p-2 cursor-pointer" style="color:lime;" v-else-if="page > (pageNum - 5) && page < (pageNum + 5)" @click="setPageNumber(page)">{{ page }}</span>
      </span>
      <span class="p-2 font-bold" style="color:lime;" v-if="(pageNum + 5) <= pages.length">. . .</span>
    </div>
    <div class="text-2xl p-5">Transaction History</div>
    <div v-if="transactions.length >= 1">
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
    <div v-else>No Transactions Found</div>
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
            v-show="offset + limit < totalCount">
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
      pageNum: 1,
      pages: [],
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
      this.transactions = [];
      this.pages = [];
      this.totalCount = 0;
      const results = await this.$http.get(`/admin/transactions/${this.$route.params.id}`, {
        limit: this.limit,
        offset: this.offset,
      })
      this.transactions = results.data.results.transactions;
      this.totalCount = results.data.results.total[0].count;
      let pages = Math.ceil(this.totalCount/this.limit);
        for(let i = 1; pages >= i; i++){
          this.pages.push(i);
        }
        if(this.pageNum > pages && this.totalCount > 0){
          this.pageNum = 1;
          this.offset = 0;
          setTimeout(this.getTransactions, 1000);
        }
    },
    formatReason(data) {
      const index = this.reasons.indexOf(data);
      if(index === -1) {
        return "Weekly Role Credit";
      } else {
        return this.reasonDisplay[index];
      }
    },
    setLimit(){
      this.offset = 0;
      this.pageNum = 1;
      this.getTransactions();
    },
    setPageNumber(value){
      this.pageNum = value;
      this.offset = this.pageNum * this.limit - this.limit;
      this.getTransactions();
    },
    async next() {
      this.offset = this.pageNum * this.limit;
      this.pageNum++
      await this.getTransactions();
    },
    async back() {
      this.pageNum--
      this.offset = this.pageNum * this.limit - this.limit;
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
