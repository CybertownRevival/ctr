<template>
  <div class="w-full flex flex-col items-center">
    <div class="flex justify-center w-full mb-8">
      <h1 class="text-2xl font-semibold">Club Members</h1>
    </div>
    <div class="flex justify-center w-full mb-5" v-if="isAdmin">
      <select
          v-model="status"
          class="border border-gray-400 p-2 rounded"
          @change="filterByStatus"
      >
        <option value="member">Member</option>
        <option value="pending">Pending</option>
        <option value="banned">Banned</option>
      </select>
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
        :class="{ 'btn-disabled': offset + limit >= membersCount }"
        :disabled="offset + limit >= membersCount"
        @click="next"
      >
        Next
      </button>
    </div>
    <div class="flex justify-center text-center w-full">
      <table class="w-2/3 border-double border-4 border-gray-400">
            <tr>
              <th class="border-double border-4 border-gray-400 text-chat">No</th>
              <th class="border-double border-4 border-gray-400 text-chat">Username</th>
              <th 
                  class="border-double border-4 border-gray-400 text-chat"
                  v-if="isAdmin">Action</th>
            </tr>
            <tr v-for="(member, index) in members" :key="member.username">
              <td class="border-double border-4 border-gray-400">
                {{ offset + index + 1 }}
              </td>
              <td class="border-double border-4 border-gray-400">
                {{ member.username }}
              </td>
              <td class="border-double border-4 border-gray-400" v-if="isAdmin">
                <span v-if="member.status === 'member'">
                  <button class="btn-ui-inline py-0.5">Ban</button>
                </span>
                <span v-if="member.status === 'pending'">
                  <button class="btn-ui-inline py-0.5">Accept</button>
                  <button class="btn-ui-inline py-0.5">Reject</button>
                </span>
                <span v-if="member.status === 'banned'">
                  <button class="btn-ui-inline py-0.5">Unban</button>
                </span>
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
      membersCount: 0,
      limit: 10,
      members: [],
      isAdmin: false,
      offset: 0,
      status: "member",
      orderBy: "name",
      order: "asc",
    };
  },
  methods: {
    async fetchMembers() {
      const clubs = await this.$http.get(("/club/search"), {
        limit: this.limit,
        offset: this.offset,
        status: this.status,
        orderBy: this.orderBy,
        order: this.order,
      });
      this.members = clubs.data.results.members;
      this.membersCount = clubs.data.results.membersCount[0].count;
      console.log("Offset:", this.offset, "Limit:", this.limit, "ClubsCount:", this.membersCount);
    },
    next() {
      this.offset += this.limit;
      this.fetchMembers();
    },
    prev() {
      this.offset -= this.limit;
      this.fetchMembers();
    },
  },
  mounted() {
    this.fetchMembers();
  },
});
</script>
