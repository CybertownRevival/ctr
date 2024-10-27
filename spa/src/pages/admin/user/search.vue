<template>
  <div class="grid grid-cols-1 w-full place-items-center">
    <div class="text-center w-full text-5xl mb-1">Citizen Search</div>
  <div class="grid grid-cols-2 w-4/6 justify-items-center">
    <div>
    Username Search: 
    <input class="text-black" type="text" v-model="search" @input="searchUsers"/>
    </div>
    <div>
    View Amount:
    <select v-model.number="limit" @change="searchUsers">
      <option value=10>10</option>
      <option value=20>20</option>
      <option value=50>50</option>
      <option value=100>100</option>
    </select>
    </div>
  </div>
    <div class="grid-cols-1 w-4/6 justify-items-center text-center">
      Total Count: {{ this.totalCount }}
    </div>
  <div class="grid grid-cols-5 text-center w-4/6"
       :class="{'grid-cols-7': accessLevel.includes('admin')}">
    <div class="border-white border w-full pl-1">ID</div>
    <div class="col-span-2 border-white border w-full pl-1">Username</div>
    <div
      class="col-span-2 border-white border w-full pl-1"
      v-show="accessLevel.includes('admin')">Email</div>
    <div class="col-span-2 border-white border w-full pl-1">Last Login</div>
  </div>
  <div
      class="grid grid-cols-5 w-4/6"
      v-for="(id) in users"
      :key="id.id"
      :class="{'grid-cols-7': accessLevel.includes('admin')}">
    <div class="border-white border w-full pl-1 text-center">{{ id.id }}</div>
    <div class="col-span-2 border-white border w-full pl-1">
      <router-link :to="'/admin/member/user/'+id.id">
      {{ id.username }}
      </router-link>
    </div>
    <div
     class="col-span-2 border-white border w-full pl-1"
     v-show="accessLevel.includes('admin')">{{ id.email }}</div>
    <div class="col-span-2 border-white border w-full pl-1">{{ new Date(id.last_daily_login_credit)
        .toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          timeZone: 'America/Detroit',
        }) }}</div>
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
  name: "UserSearch",
  data: () => {
    return {
      totalCount: 0,
      users: [],
      search: "",
      limit: 10,
      offset: 0,
      showNext: true,
      error: null,
    };
  },
  props: [
    "accessLevel",
  ],
  methods: {
    async getUsers(): Promise<any> {
      try {
        return this.$http.get(
          "/admin/usersearch/", {
            limit: this.limit,
            offset: this.offset,
            search: this.search,
          },
        ).then((response) => {
          this.users = response.data.results.users;
          this.totalCount = response.data.results.total[0].count;
        });
      } catch (error) {
        this.error = error;
      }
    },
    async searchUsers(): Promise<any> {
      this.offset = 0;
      try {
        return this.$http.get(
          "/admin/usersearch/", {
            limit: this.limit,
            offset: this.offset,
            search: this.search,
          },
        ).then((response) => {
          this.users = response.data.results.users;
          this.totalCount = response.data.results.total[0].count;
        });
      } catch (error) {
        this.error = error;
      }
    },
    async next() {
      this.offset = this.offset + this.limit;
      await this.getUsers();
    },
    async back() {
      this.offset = this.offset - this.limit;
      await this.getUsers();
      this.showNext = true;
    },
  },
  async created() {
    await this.getUsers();
  },
});
</script>
