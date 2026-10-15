
<template>
  <div class="min-h-screen bg-black p-6 font-sans text-gray-200">
    <h1 class="mb-6 text-center text-2xl font-bold text-green-500">
      FUNDBOX
    </h1>

    <div class="mx-auto max-w-3xl">
      <p v-if="loading" class="text-center text-gray-400">
        Loading Fundbox...
      </p>

      <div
        v-else-if="error"
        class="rounded border border-red-700 p-4 text-center text-red-400"
      >
        {{ error }}
      </div>

      <div v-else-if="fundbox">
        <!-- Balance: authorised members only -->
        <div
          v-if="fundbox.can_view"
          class="rounded border border-gray-700 p-6 text-center"
        >
          <h2 class="mb-3 text-xl font-bold text-green-400">
            {{ fundbox.place_name || "Fundbox" }}
          </h2>

          <p class="mb-2 text-sm text-gray-400">
            Available Balance
          </p>

          <p class="text-3xl font-bold text-white">
            {{ formatCC(fundbox.balance) }} CC
          </p>
        </div>

        <!-- Donation form: all logged-in members -->
        <div class="mt-6 rounded border border-gray-700 p-6">
          <h3 class="mb-4 text-center text-xl font-bold text-green-400">
            Donate CC
          </h3>

          <p class="mb-4 text-center text-sm text-gray-400">
            Support {{ fundbox.place_name }} by donating Cybertown Credits.
          </p>

          <form @submit.prevent="donateCC">
            <label for="donationAmount" class="mb-2 block text-sm">
              Donation amount (CC)
            </label>

            <input
              id="donationAmount"
              v-model="donationAmount"
              type="number"
              min="1"
              step="1"
              required
              class="w-full rounded border border-gray-600 bg-gray-900 p-3 text-white"
              placeholder="Enter amount"
            />

            <button
              type="submit"
              :disabled="donating"
              class="mt-4 w-full rounded bg-green-700 p-3 font-bold text-white disabled:opacity-50"
            >
              {{ donating ? "Processing..." : "Donate CC" }}
            </button>
          </form>

          <p
            v-if="donationMessage"
            class="mt-4 text-center text-sm text-green-400"
          >
            {{ donationMessage }}
          </p>
        </div>

        <!-- Award CC: authorised leaders/owners only -->
        <div
          v-if="fundbox.can_award"
          class="mt-6 rounded border border-gray-700 p-6"
        >
          <h3 class="mb-4 text-center text-xl font-bold text-green-400">
            Award CC
          </h3>

          <p class="mb-4 text-center text-sm text-gray-400">
            Award Cybertown Credits from {{ fundbox.place_name }} to a resident.
          </p>

          <form @submit.prevent="awardCC">
            <label for="awardUsername" class="mb-2 block text-sm">
              Recipient username
            </label>

            <input
              id="awardUsername"
              v-model="awardUsername"
              type="text"
              required
              class="mb-4 w-full rounded border border-gray-600 bg-gray-900 p-3 text-white"
              placeholder="Enter username"
            />

            <label for="awardAmount" class="mb-2 block text-sm">
              Award amount (CC)
            </label>

            <input
              id="awardAmount"
              v-model="awardAmount"
              type="number"
              min="1"
              step="1"
              required
              class="w-full rounded border border-gray-600 bg-gray-900 p-3 text-white"
              placeholder="Enter amount"
            />

            <button
              type="submit"
              :disabled="awarding"
              class="mt-4 w-full rounded bg-green-700 p-3 font-bold text-white disabled:opacity-50"
            >
              {{ awarding ? "Processing..." : "Award CC" }}
            </button>
          </form>

          <p
            v-if="awardMessage"
            class="mt-4 text-center text-sm text-green-400"
          >
            {{ awardMessage }}
          </p>
        </div>
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
    };
  },

  methods: {
    formatCC(amount: number | string): string {
      const value = Number(amount);

      return Number.isFinite(value)
        ? value.toLocaleString("en-GB")
        : "Unavailable";
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
        !/^[0-9]+$/.test(this.donationAmount.trim())
      ) {
        this.donationMessage = "Please enter a valid whole number of CC.";
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
        !/^[0-9]+$/.test(this.awardAmount.trim())
      ) {
        this.awardMessage = "Please enter a valid whole number of CC.";
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
