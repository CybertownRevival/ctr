<template>
  <div class="grid grid-cols-1 w-full place-items-center">
    <div class="text-center w-full text-5xl mt-1 mb-1">Chat Search</div>
    <div class="grid grid-cols-2 w-4/6 justify-items-center">
      <div>
        Place Name Search:
        <input class="text-black" type="text" v-model="search" @input="searchPlace"/>
      </div>
      <div>
        View Amount:
        <select v-model.number="limit" @change="searchPlace">
          <option value=10>10</option>
          <option value=20>20</option>
          <option value=50>50</option>
          <option value=100>100</option>
        </select>
      </div>
    </div>
    <div class="grid grid-cols-7 text-center w-4/6">
      <div class="border-white border w-full pl-1">Date</div>
      <div class="col-span-2 border-white border w-full pl-1">Time</div>
      <div class="col-span-2 border-white border w-full pl-1">Place</div>
      <div class="col-span-2 border-white border w-full pl-1">Message</div>
    </div>
    <div class="grid grid-cols-7 w-4/6" v-for="(id) in chat" :key="id.id"
    :class="{ 'bg-red-900': id.status === 0 }">
      <div class="border-white border w-full pl-1 text-center">
        {{ new Date(id.created_at)
          .toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'America/Detroit',
          }) }}
      </div>
      <div class="col-span-2 border-white border w-full pl-1">
        {{ new Date(id.created_at)
          .toLocaleString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
            timeZone: 'America/Detroit',
          }) }}
      </div>
      <div class="col-span-2 border-white border w-full pl-1">{{ id.name }}</div>
      <div class="col-span-2 border-white border w-full pl-1">{{ id.body }}</div>
    </div>
    <div class="grid grid-cols-2 w-4/6 justify-items-center">
      <div class="p-1 text-right w-full">
        <button
            class="bg-gray-300 text-black w-4/6"
            @click="back"
            v-show="offset != 0">
          BACK
        </button>
      </div>
      <div class="p-1 text-left w-full">
        <button
            class="bg-gray-300 text-black w-4/6"
            @click="next"
            v-show="this.offset + this.limit <= this.totalCount">
          NEXT
        </button>
      </div>
    </div>
  </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "UserChat",
  data: () => {
    return {
      chat: [],
      totalCount: 0,
      search: "",
      limit: 10,
      offset: 0,
      showNext: true,
      error: null,
    };
  },
  methods: {
    async getUserChat(): Promise<any> {
      try {
        return this.$http.post("/admin/userchat", {
          search: this.search,
          user: this.$route.params.id,
          limit: this.limit,
          offset: this.offset,
        }).then((response) => {
          this.chat = response.data.results.messages;
          this.totalCount = response.data.results.total[0].count;
        });
      } catch (error) {
        this.error = error;
      }
    },
    async searchPlace(): Promise<any> {
      this.offset = 0;
      try {
        return this.$http.post("/admin/userchat", {
          search: this.search,
          user: this.$route.params.id,
          limit: this.limit,
          offset: this.offset,
        }).then((response) => {
          this.chat = response.data.results.messages;
          this.totalCount = response.data.results.total[0].count;
        });
      } catch (error) {
        this.error = error;
      }
    },
    async next() {
      this.offset = this.offset + this.limit;
      await this.getUserChat();
    },
    async back() {
      this.offset = this.offset - this.limit;
      await this.getUserChat();
      this.showNext = true;
    },
  },
  async created() {
    await this.getUserChat();
  },
});
</script>
