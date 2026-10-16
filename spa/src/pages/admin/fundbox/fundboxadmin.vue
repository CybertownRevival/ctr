

<template>
  <div class="w-full p-4 text-center">
    <h1 class="mb-6 text-3xl font-bold text-gray-300">
      FUNDBOX ADMINISTRATION
    </h1>

    <div class="mx-auto w-full max-w-5xl border border-white p-5">
      <h2 class="mb-4 text-2xl font-bold text-green">
        Fundbox Overview
      </h2>

      <p class="mb-5 text-gray-300">
        Read-only overview of Fundboxes available to your role.
      </p>

      <div v-if="loading" class="py-6 text-gray-300">
        Loading Fundboxes...
      </div>

      <div v-else-if="error" class="py-6 text-red-400">
        {{ error }}
      </div>

      <template v-else>
        <!-- Colonies -->
        <div class="mb-8">
          <h2 class="mb-3 text-xl font-bold text-green text-left">
            Colonies
          </h2>

          <div v-if="colonies.length === 0" class="border border-white p-4 text-gray-300">
            No colony Fundboxes available.
          </div>

          <table v-else class="w-full border-collapse text-left">
            <thead>
              <tr class="border-b border-white text-green">
                <th class="p-3">Colony</th>
                <th class="p-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="fundbox in colonies"
                :key="fundbox.id"
                class="border-b border-gray-700 text-gray-300"
              >
                <td class="p-3 capitalize">{{ fundbox.place_name }}</td>
                <td class="p-3 text-right">
                  {{ Number(fundbox.balance).toLocaleString() }} CC
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="border-t border-white font-bold text-green">
                <td class="p-3">Colony Total</td>
                <td class="p-3 text-right">
                  {{ colonyBalance.toLocaleString() }} CC
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Places -->
        <div class="mb-8">
          <h2 class="mb-3 text-xl font-bold text-green text-left">
            Places
          </h2>

          <div v-if="places.length === 0" class="border border-white p-4 text-gray-300">
            No place Fundboxes available.
          </div>

          <table v-else class="w-full border-collapse text-left">
            <thead>
              <tr class="border-b border-white text-green">
                <th class="p-3">Place</th>
                <th class="p-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="fundbox in places"
                :key="fundbox.id"
                class="border-b border-gray-700 text-gray-300"
              >
                <td class="p-3 capitalize">{{ fundbox.place_name }}</td>
                <td class="p-3 text-right">
                  {{ Number(fundbox.balance).toLocaleString() }} CC
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="border-t border-white font-bold text-green">
                <td class="p-3">Places Total</td>
                <td class="p-3 text-right">
                  {{ placeBalance.toLocaleString() }} CC
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Overall total -->
        <div class="border border-white p-4">
          <div class="text-gray-300">Overall Fundbox Balance</div>
          <div class="mt-2 text-3xl font-bold text-green">
            {{ totalBalance.toLocaleString() }} CC
          </div>
          <div class="mt-2 text-sm text-gray-400">
            Across {{ fundboxes.length }} Fundboxes
          </div>
        </div>
      </template>
    </div>
  </div>
</template>



<script lang="ts">
import Vue from "vue";

interface Fundbox {
  id: number;
  place_id: number;
  place_name: string;
  place_type: string;
  place_slug: string;
  balance: number;
}

export default Vue.extend({
  name: "FundboxAdmin",

  data(): {
    fundboxes: Fundbox[];
    loading: boolean;
    error: string;
  } {
    return {
      fundboxes: [],
      loading: true,
      error: "",
    };
  },

computed: {
  colonies(): Fundbox[] {
    return this.fundboxes.filter(
      fundbox => fundbox.place_type === "colony"
    );
  },

  places(): Fundbox[] {
    return this.fundboxes.filter(
      fundbox => fundbox.place_type !== "colony"
    );
  },

  colonyBalance(): number {
    return this.colonies.reduce(
      (total, fundbox) => total + Number(fundbox.balance),
      0
    );
  },

  placeBalance(): number {
    return this.places.reduce(
      (total, fundbox) => total + Number(fundbox.balance),
      0
    );
  },

  totalBalance(): number {
    return this.colonyBalance + this.placeBalance;
  },
},


  methods: {
    async loadFundboxes(): Promise<void> {
      this.loading = true;
      this.error = "";

      try {
        const response = await this.$http.get("/fundbox/audit");
        this.fundboxes = response.data;
      } catch (error) {
        console.error(error);
        this.error = "Unable to load Fundbox information.";
      } finally {
        this.loading = false;
      }
    },
  },

  created() {
    this.loadFundboxes();
  },
});
</script>