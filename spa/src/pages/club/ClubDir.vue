<template>
  <div class="w-full flex flex-col items-center">
    <div class="flex justify-center w-full mb-8">
      <h1 class="text-2xl font-semibold">Club Directory</h1>
    </div>
    <div class="flex justify-center w-full mb-5">
      Search:
      <span class="mx-8">
        <input
          v-model="search"
          class="text-black"
          type="text"
          placeholder="Search Club Name"
        />
      </span>
      <button class="btn" @click="fetchClubs">Search</button>
    </div>
    <div class="flex justify-center w-full mb-5">
      <button
        class="btn mr-4"
        :class="{ 'btn-disabled': offset === 0 }"
        :disabled="offset === 0"
        @click="prev"
      >
        Prev
      </button>
      <button
        class="btn ml-4"
        :class="{ 'btn-disabled': offset + limit >= clubsCount }"
        :disabled="offset + limit >= clubsCount"
        @click="next"
      >
        Next
      </button>
    </div>
    <div class="flex justify-center text-center w-full">
      <table class="w-2/3 border-double border-4 border-gray-400">
            <tr>
              <th class="border-double border-4 border-gray-400 font-chat">No</th>
              <th class="border-double border-4 border-gray-400 font-chat">Club Name<br>Owner</th>
              <th class="border-double border-4 border-gray-400 font-chat">Members</th>
              <th class="border-double border-4 border-gray-400 font-chat">Membership</th>
            </tr>
            <tr v-for="(club, index) in clubs" :key="club.id">
              <td class="border-double border-4 border-gray-400">
                {{ offset + index + 1 }}
              </td>
              <td class="border-double border-4 border-gray-400">
                <router-link :to="'/club/' + club.id">
                  {{ club.name }}
                </router-link>
                <br>{{ club.owner }}
              </td>
              <td class="border-double border-4 border-gray-400">
                {{ club.member_count }}
              </td>
              <td class="border-double border-4 border-gray-400">
                {{ club.private ? "Private" : "Public" }}
              </td>
            </tr>
          </table>
    </div>
  </div>
</template>

<script>
import Vue from "vue";

export default Vue.extend({
  name: "ClubDirPage",
  data: () => {
    return {
      clubs: [],
      clubsCount: 0,
      limit: 10,
      offset: 0,
      search: "",
      orderBy: "name",
      order: "asc",
    };
  },
  methods: {
    async fetchClubs() {
      const clubs = await this.$http.get(("/club/search"), {
        limit: this.limit,
        offset: this.offset,
        search: this.search,
        orderBy: this.orderBy,
        order: this.order,
      });
      this.clubs = clubs.data.results.clubs;
      this.clubsCount = clubs.data.results.clubsCount[0].count;
    },
    next() {
      this.offset += this.limit;
      this.fetchClubs();
    },
    prev() {
      this.offset -= this.limit;
      this.fetchClubs();
    },
  },
  mounted() {
    this.fetchClubs();
  },
});
</script>
