<template>
  <div class="flex min-h-screen flex-col items-center bg-black px-4 py-6 font-sans text-indigo-100">
    <div class="mx-auto w-full max-w-3xl">
      <h1 class="mb-5 text-center text-3xl font-bold text-gray-300">FUNDBOX</h1>

      <p v-if="loading" class="text-center">Loading Fundbox...</p>
      <p v-else-if="error" class="text-center text-red-400">{{ error }}</p>

      <div v-else-if="fundbox">
        <h2 class="mb-3 text-center text-2xl font-bold text-green">
          {{ fundbox.place_name || "Fundbox" }}
        </h2>

        <div v-if="fundbox.can_view" class="mx-auto mb-6 w-full max-w-3xl rounded-xl border border-white px-5 py-5 text-center">
          <div class="text-2xl font-bold text-green">Available Balance</div>
          <div class="mt-2 text-xl">{{ formatCC(fundbox.balance) }} CCs</div>
        </div>

        <section class="mx-auto mb-6 w-full max-w-3xl rounded-xl border border-white px-5 py-6">
          <h3 class="mb-2 text-center text-2xl font-bold text-green">Donate CCs</h3>
          <p class="mb-4 text-center">
            Support {{ fundbox.place_name }} by donating CCs.
          </p>
          <form class="mx-auto max-w-lg" @submit.prevent="donateCC">
            <div class="flex flex-wrap items-center justify-center gap-3">
              <label for="donationAmount" class="font-bold">Amount (CC):</label>
              <input
                id="donationAmount"
                v-model="donationAmount"
                type="number"
                min="1"
                max="99999999"
                step="1"
                required
                class="w-36 border border-gray-400 bg-white px-2 py-1 text-lg text-black rounded-none"
                placeholder="0"
              />
              <button
                type="submit"
                :disabled="donating"
                class="border border-green-800 bg-green-700 px-5 py-2 font-bold text-white rounded-none disabled:opacity-50"
              >
                {{ donating ? "Processing..." : "Donate CCs" }}
              </button>
            </div>
          </form>
          <p v-if="donationMessage" class="mt-3 text-center" role="status">
            {{ donationMessage }}
          </p>
        </section>

        <section v-if="fundbox.can_award" class="mx-auto mb-6 w-full max-w-3xl rounded-xl border border-white px-5 py-6">
          <h3 class="mb-2 text-center text-2xl font-bold text-green">Award CCs</h3>
          <p class="mb-4 text-center">
            Award CCs from {{ fundbox.place_name }} to a resident.
          </p>
          <form class="mx-auto max-w-lg" @submit.prevent="awardCC">
            <div class="mb-3 flex flex-wrap items-center justify-center gap-3">
              <label for="awardUsername" class="font-bold">Recipient:</label>
              <input
                id="awardUsername"
                v-model="awardUsername"
                type="text"
                required
                class="w-60 max-w-full border border-gray-400 bg-white px-2 py-1 text-lg text-black rounded-none"
                placeholder="Username"
              />
            </div>
            <div class="flex flex-wrap items-center justify-center gap-3">
              <label for="awardAmount" class="font-bold">Amount (CC):</label>
              <input
                id="awardAmount"
                v-model="awardAmount"
                type="number"
                min="1"
                max="99999999"
                step="1"
                required
                class="w-36 border border-gray-400 bg-white px-2 py-1 text-lg text-black rounded-none"
                placeholder="0"
              />
              <button
                type="submit"
                :disabled="awarding"
                class="border border-red-800 bg-red-700 px-5 py-2 font-bold text-white rounded-none disabled:opacity-50"
              >
                {{ awarding ? "Processing..." : "Award CCs" }}
              </button>
            </div>
          </form>
          <p v-if="awardMessage" class="mt-3 text-center" role="status">
            {{ awardMessage }}
          </p>
        </section>

        <section v-if="fundbox.can_view" class="mx-auto mt-6 w-full max-w-3xl rounded-xl border border-white px-5 py-6">
          <h3 class="mb-4 text-center text-2xl font-bold text-green">
            Transaction History
          </h3>
          <p v-if="transactionsLoading" class="text-center">Loading transactions...</p>
          <p v-else-if="transactionsError" class="text-center text-red-400">
            {{ transactionsError }}
          </p>
          <p v-else-if="transactions.length === 0" class="text-center">
            No transactions recorded.
          </p>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="border-b border-indigo-200 font-bold text-indigo-100">
                <tr>
                  <th class="p-2">Date</th>
                  <th class="p-2">Type</th>
                  <th class="p-2">Member</th>
                  <th class="p-2 text-right">Amount</th>
                  <th class="p-2">Authorised By</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="transaction in transactions"
                  :key="transaction.id"
                  class="border-b border-gray-800"
                >
                  <td class="whitespace-nowrap p-2">{{ formatDate(transaction.created_at) }}</td>
                  <td
                    class="p-2"
                    :class="transaction.recipient_wallet_id === fundbox.wallet_id ? 'text-green-400' : 'text-red-400'"
                  >
                    {{ transaction.recipient_wallet_id === fundbox.wallet_id ? "Donation" : "Award" }}
                  </td>
                  <td class="p-2">
                    {{ transaction.recipient_wallet_id === fundbox.wallet_id
                      ? (transaction.sender_username || "Unknown")
                      : (transaction.recipient_username || "Unknown") }}
                  </td>
                  <td
                    class="whitespace-nowrap p-2 text-right"
                    :class="transaction.recipient_wallet_id === fundbox.wallet_id ? 'text-green-400' : 'text-red-400'"
                  >
                    {{ transaction.recipient_wallet_id === fundbox.wallet_id ? "+" : "−" }}{{ formatCC(transaction.amount) }} CC
                  </td>
                  <td class="p-2">
                    {{ transaction.recipient_wallet_id === fundbox.wallet_id
                      ? "—"
                      : (transaction.authorized_by_username || "Unknown") }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "FundboxPage",

  data() {
    return {
      fundbox: null as any,
      loading: true,
      error: "",

      donationAmount: "",
      donating: false,
      donationMessage: "",

      awardUsername: "",
      awardAmount: "",
      awarding: false,
      awardMessage: "",
      transactions: [] as any[],
      transactionsLoading: false,
      transactionsError: "",
    };
  },

  methods: {
    formatCC(amount: number | string): string {
      const value = Number(amount);

      return Number.isFinite(value)
        ? value.toLocaleString("en-GB")
        : "Unavailable";
    },

    formatDate(date: string): string {
      return new Date(date).toLocaleString("en-GB");
    },

    async loadTransactions() {
      if (!this.fundbox || !this.fundbox.can_view) {
        this.transactions = [];
        return;
      }

      this.transactionsLoading = true;
      this.transactionsError = "";

      try {
        const response = await this.$http.get(
          `/fundbox/${this.fundbox.id}/transactions`
        );

        this.transactions = response.data;
      } catch (error) {
        this.transactionsError = "Unable to load transaction history.";
      } finally {
        this.transactionsLoading = false;
      }
    },

    async loadFundbox() {
      this.loading = true;
      this.error = "";
      this.fundbox = null;

      try {
        const id = this.$route.params.id;

        const publicResponse = await this.$http.get(
          `/fundbox/${id}/public`
        );

        const publicFundbox = publicResponse.data;
        this.fundbox = publicFundbox;

        if (publicFundbox.can_view) {
          try {
            const privateResponse = await this.$http.get(
              `/fundbox/${id}`
            );

            this.fundbox = {
              ...publicFundbox,
              ...privateResponse.data,
            };

            await this.loadTransactions();

          } catch (error) {
            // Public details and donations remain accessible.
            this.fundbox = {
              ...publicFundbox,
              can_view: false,
              can_award: false,
            };
          }
        }
      } catch (error) {
        const status = error.response && error.response.status;

        if (status === 401) {
          this.error = "Please log in to access this Fundbox.";
        } else if (status === 404) {
          this.error = "Fundbox not found.";
        } else {
          this.error = "Unable to load Fundbox details.";
        }
      } finally {
        this.loading = false;
      }
    },

    async donateCC() {
      if (this.donating || !this.fundbox) {
        return;
      }

      this.donationMessage = "";

      const amount = Number(this.donationAmount);

      if (
        !Number.isSafeInteger(amount) ||
        amount <= 0 ||
        amount > 99999999 ||
        !/^[0-9]+$/.test(this.donationAmount.trim())
      ) {
        this.donationMessage = "Please enter a whole number between 1 and 99,999,999 CC.";
        return;
      }

      const confirmed = window.confirm(
        `Are you sure you want to donate ${this.formatCC(amount)} CC to ${this.fundbox.place_name}?`
      );

      if (!confirmed) {
        return;
      }

      this.donating = true;

      try {
        await this.$http.post("/fundbox/donate", {
          fundboxId: this.fundbox.id,
          amount,
        });

        this.donationAmount = "";
        this.donationMessage =
          `Successfully donated ${this.formatCC(amount)} CC!`;

        if (this.fundbox.can_view) {
          try {
            const response = await this.$http.get(
              `/fundbox/${this.fundbox.id}`
            );

            this.fundbox = {
              ...this.fundbox,
              ...response.data,
            };

          await this.loadTransactions();

          } catch (error) {
            // Donation succeeded even if refresh failed.
          }
        }
      } catch (error) {
        const message =
          error.response &&
          error.response.data &&
          error.response.data.error;

        this.donationMessage =
          typeof message === "string"
            ? message
            : "Donation failed. Please try again.";
      } finally {
        this.donating = false;
      }
    },

    async awardCC() {
      if (
        this.awarding ||
        !this.fundbox ||
        !this.fundbox.can_award
      ) {
        return;
      }

      this.awardMessage = "";

      const username = this.awardUsername.trim();
      const amount = Number(this.awardAmount);

      if (!username) {
        this.awardMessage = "Please enter a recipient username.";
        return;
      }

      if (
        !Number.isSafeInteger(amount) ||
        amount <= 0 ||
        amount > 99999999 ||
        !/^[0-9]+$/.test(this.awardAmount.trim())
      ) {
        this.awardMessage = "Please enter a whole number between 1 and 99,999,999 CC.";
        return;
      }

      if (
        !Number.isFinite(Number(this.fundbox.balance)) ||
        amount > Number(this.fundbox.balance)
      ) {
        this.awardMessage = "Insufficient or unavailable Fundbox balance.";
        return;
      }

      this.awarding = true;

      try {
        const lookup = await this.$http.get(
          `/member/id/${encodeURIComponent(username)}`
        );

        const matches = lookup.data.userId;

        if (
          !Array.isArray(matches) ||
          matches.length !== 1 ||
          !Number.isSafeInteger(matches[0].id) ||
          matches[0].id <= 0
        ) {
          this.awardMessage = "Recipient not found.";
          return;
        }

        const recipientId = matches[0].id;

        const confirmed = window.confirm(
          `Are you sure you want to award ${this.formatCC(amount)} CC from ${this.fundbox.place_name} to ${username}?`
        );

        if (!confirmed) {
          return;
        }

        await this.$http.post("/fundbox/award", {
          fundboxId: this.fundbox.id,
          recipientId,
          amount,
        });

        this.awardUsername = "";
        this.awardAmount = "";

        this.awardMessage =
          `Successfully awarded ${this.formatCC(amount)} CC to ${username}!`;

        try {
          const response = await this.$http.get(
            `/fundbox/${this.fundbox.id}`
          );

          this.fundbox = {
            ...this.fundbox,
            ...response.data,
          };

        await this.loadTransactions();

        } catch (refreshError) {
          // Award succeeded even if balance refresh failed.
        }
      } catch (error) {
        const message =
          error.response &&
          error.response.data &&
          error.response.data.error;

        this.awardMessage =
          typeof message === "string"
            ? message
            : "Unable to award CC. Please try again.";
      } finally {
        this.awarding = false;
      }
    },
  },

  mounted() {
    this.loadFundbox();
  },
});
</script>
