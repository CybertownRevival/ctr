<template>
  <div class="w-full flex flex-col items-center">
    <div class="flex justify-center w-full mb-8">
      <h1 class="text-2xl font-semibold">Club Members</h1>
    </div>
    <div class="flex justify-center w-full mb-5" v-if="canAdmin">
      <select
          v-model="status"
          class="border border-gray-400 p-2 rounded"
          @change="fetchMembers"
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
                  v-if="canAdmin">Action</th>
            </tr>
            <tr v-for="(member, index) in members" :key="member.username">
              <td class="border-double border-4 border-gray-400">
                {{ offset + index + 1 }}
              </td>
              <td class="border-double border-4 border-gray-400">
                {{ member.username }}
              </td>
              <td class="border-double border-4 border-gray-400" v-if="canAdmin">
                <span v-if="member.status === 'member'">
                  <button class="btn-ui-inline py-0.5" @click="reject(member.username)">
                    Ban
                  </button>
                </span>
                <span v-if="member.status === 'pending'">
                  <button class="btn-ui-inline py-0.5" @click="approve(member.username)">
                    Accept
                  </button>
                  <button class="btn-ui-inline py-0.5" @click="reject(member.username)">
                    Reject
                  </button>
                </span>
                <span v-if="member.status === 'banned'">
                  <button class="btn-ui-inline py-0.5" @click="approve(member.username)">
                    Unban
                  </button>
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
  name: "ClubMemberList",
  data: () => {
    return {
      membersCount: 0,
      limit: 10,
      members: [],
      isAdmin: false,
      offset: 0,
      status: "member",
      orderBy: "username",
      order: "asc",
    };
  },
  methods: {
    async checkAdmin() {
      try {
        const adminCheck = await this.$http
          .get(`/place/can_admin/${this.$store.data.place.slug}/${this.$store.data.place.id}`);
        this.canAdmin = adminCheck.data.result;
      } catch (error) {
        this.canAdmin = false;
      }
    },
    async fetchMembers() {
      const memberResults = await this.$http.get(("/club/members"), {
        clubId: this.$route.params.id,
        limit: this.limit,
        offset: this.offset,
        status: this.status,
        orderBy: this.orderBy,
        order: this.order,
      });
      this.members = memberResults.data.results.members;
      this.membersCount = memberResults.data.results.membersCount;
    },
    async approve(username) {
      await this.$http.post("/club/changememberstatus", {
        clubId: this.$route.params.id,
        username: username,
        status: "member",
      });
      await this.fetchMembers();
    },
    async reject(username) {
      await this.$http.post("/club/changememberstatus", {
        clubId: this.$route.params.id,
        username: username,
        status: "banned",
      });
      await this.fetchMembers();
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
