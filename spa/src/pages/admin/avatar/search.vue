<template>
  <div class="grid grid-cols-1 w-full place-items-center">
    <div class="text-center w-full text-5xl mb-1">Avatars</div>
    <div class="grid grid-cols-2 w-4/6 justify-items-center">
      <div>
        Status:
        <select v-model="status"
                @change="getResults">
          <option value="2">Pending Approval</option>
          <option value="1">Live</option>
          <option value="0">Rejected</option>
        </select>
      </div>
      <div>
        View Amount:
        <select v-model="limit"
                @change="getResults">
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>
    </div>
    <div class="grid-cols-1 w-4/6 justify-items-center text-center">
      Total Count: {{ totalCount }}
    </div>
    <table class="table-auto border-collapse">
      <tr>
        <th class="p-4">ID</th>
        <th class="p-4">Name</th>
        <th class="p-4">Member</th>
        <th class="p-4">Access</th>
        <th class="p-4">Status</th>
        <th class="p-4">Files</th>
        <th class="p-4">Actions</th>
      </tr>
      <tr v-for="avatar in avatars"
          :key="avatar.id">
        <td class="p-4">{{ avatar.id }}</td>
        <td class="p-4">{{ avatar.name }}</td>
        <td class="p-4">{{ avatar.username ? avatar.username : '' }}</td>
        <td class="p-4">{{ accessLabel[avatar.private] }}</td>
        <td class="p-4">{{ statusLabel[avatar.status] }}</td>
        <td class="p-4">
          <button class="btn" @click="downloadWrl(avatar.id)">WRL</button>
          <button class="btn" @click="downloadThumbnail(avatar.id)">Thumbnail</button>
        </td>
        <td class="p-4">
          <button class="btn" @click="approve(avatar.id)">Approve</button>
          <button class="btn" @click="reject(avatar.id)">Reject</button>
        </td>
      </tr>
    </table>
    <div class="grid grid-cols-2 w-4/6 justify-items-center">
      <div class="p-1 text-right w-full">
        <button class="btn"
                @click="back"
                v-show="offset != 0">
          BACK
        </button>
      </div>
      <div class="p-1 text-left w-full">
        <button class="btn"
                @click="next"
                v-show="offset + limit <= totalCount">
          NEXT
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "AvatarSearch",
  data: () => {
    return {
      totalCount: 0,
      avatars: [],
      status: 2,
      limit: 10,
      offset: 0,
      showNext: true,
      error: null,
      statusLabel: [
        'Deleted',
        'Live',
        'Pending Approval',
      ],
      accessLabel: [
        'Private',
        'Public'
      ]
    };
  },
  props: [
    "accessLevel",
  ],
  methods: {
    async getResults(): Promise<any> {
      try {
        return this.$http.get(
          "/admin/avatars/", {
          limit: this.limit,
          offset: this.offset,
          status: this.status,
        },
        ).then((response) => {
          this.avatars = response.data.results.avatars;
          this.totalCount = response.data.results.total[0].count;
        });
      } catch (error) {
        this.error = error;
      }
    },

    async approve(id): Promise<any> {
      try {
        return this.$http.post(
          "/admin/avatars/approve", {
          id: id,
        },
        ).then((response) => {
          this.getResults();
        });
      } catch (error) {
        this.error = error;
      }
    },
    async reject(id): Promise<any> {
      try {
        return this.$http.post(
          "/admin/avatars/reject", {
          id: id,
        },
        ).then((response) => {
          this.getResults();
        });
      } catch (error) {
        this.error = error;
      }
    },

    downloadWrl(id) {
      const avatar = this.avatars.find(av => av.id === id);
      window.location.assign(`/assets/avatars/${avatar.directory}/${avatar.filename}`);
    },
    downloadThumbnail(id) {
      const avatar = this.avatars.find(av => av.id === id);
      window.location.assign(`/assets/avatars/${avatar.directory}/${avatar.image}`);
    },
    async next() {
      this.offset = this.offset + this.limit;
      await this.getResults();
    },
    async back() {
      this.offset = this.offset - this.limit;
      await this.getResults();
      this.showNext = true;
    },
  },
  async created() {
    await this.getResults();
  },
});
</script>
