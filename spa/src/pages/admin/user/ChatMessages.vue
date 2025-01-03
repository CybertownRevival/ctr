<template>
  <div class="grid grid-cols-1 w-full place-items-center">
    <div class="text-center w-full text-5xl mt-1 mb-1">Chat Search</div>
    <div class="grid grid-cols-2 w-4/6 justify-items-center pb-2">
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
    <div class="grid grid-cols-12 text-center w-5/6">
      <div class="col-span-1 border-white border w-full pl-1">Date</div>
      <div class="col-span-1 border-white border w-full pl-1">Time</div>
      <div class="col-span-2 border-white border w-full pl-1">Place</div>
      <div class="col-span-7 border-white border w-full pl-1">Message</div>
    </div>
    <div class="grid grid-cols-12 w-5/6" v-for="(id) in chat" :key="id.id"
    :class="{ 'bg-red-900': id.status !== 1 }">
      <div class="col-span-1 border-white border w-full pl-1 text-center">
        {{ new Date(id.created_at)
          .toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            timeZone: 'America/Detroit',
          }) }}
      </div>
      <div class="col-span-1 border-white border w-full pl-1 flex items-center">
        {{ new Date(id.created_at)
          .toLocaleString('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
            timeZone: 'America/Detroit',
          }) }}
      </div>
      <div class="col-span-2 border-white border w-full pl-1 flex items-center">{{ id.name }}</div>
      <div class="col-span-7 border-white border w-full pl-1 flex items-center">{{ id.body }}</div>
      <div class="col-span-1 border-white border w-full pl-1 flex justify-center items-center">
        <button
            class="btn"
            @click="showDelete=true; messageId=id.id"
            v-show="id.status===1">DELETE</button>
      </div>
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
    <div v-if="showDelete">
      <div class="fixed inset-0 z-50 flex justify-center items-center">
        <div class="flex flex-col w-1/6 max-w-5xl rounded-lg shadow-lg bg-red-300 text-red-800">
          <!-- header -->
          <div class="p-5">
            <div class="flex justify-between items-start">
              <h3 class="text-2xl font-semibold">Delete Message</h3>
              <button class="p-1 leading-none" @click="showDelete = false">
                <div class="text-xl font-semibold h-6 w-6">
                  <span>x</span>
                </div>
              </button>
            </div>
          </div>
          <!-- body -->
          <div class="p-6">
            <p>Are you sure you want to delete this message?</p>
          </div>
          <!-- footer -->
          <div class=" p-6 flex justify-end items-center">
            <button class="btn pr-1" @click="showDelete = false">Cancel</button>
            <button class="btn" @click="deletemessage(messageId)">Confirm</button>
          </div>
        </div>
      </div>
      <div class="opacity-50 fixed inset-0 z-60 bg-black"></div>
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
      messageId: null,
      offset: 0,
      showNext: true,
      showDelete: false,
      error: null,
    };
  },
  props: ["accessLevel"],
  methods: {
    async getUserChat(): Promise<any> {
      try {
        return this.$http.get("/admin/userchat", {
          search: this.search,
          user: this.$route.params.id,
          limit: this.limit,
          offset: this.offset,
        }).then((response) => {
          this.chat = response.data.results.messages;
          console.log(this.chat);
          this.totalCount = response.data.results.total[0].count;
        });
      } catch (error) {
        this.error = error;
      }
    },
    async searchPlace(): Promise<any> {
      this.offset = 0;
      try {
        return this.$http.get("/admin/userchat", {
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
    async deletemessage(id: number): Promise<void> {
      try{
        this.$http.post(`/message/message/${id}`);
      } catch (e) {
        console.log(e);
      }
      this.showDelete = false;
      this.getUserChat();
    },
  },
  async created() {
    if (!this.accessLevel.includes('security')) {
      this.$router.push({ name: "restrictedaccess"});
    }
    await this.getUserChat();
  },
});
</script>
