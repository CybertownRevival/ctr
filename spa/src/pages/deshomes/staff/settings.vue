<template>
  <div class="w-full flex">
    <div class="flex flex-col w-full place-items-center">
      <div class="text-red-500" v-show="error">{{ error }}</div>
      <div class="text-green-500" v-show="success">{{ success }}</div>
      <div class="text-center w-full text-5xl mb-3">Designer Homes Settings</div>

      <template v-if="loaded">
        <h3 class="font-bold">Uploading On/Off</h3>
        <div class="my-2">
          Set Status of Uploading:
          <label class="ml-2">
            <input type="radio" :value="true" v-model="uploadEnabled" /> ON
          </label>
          <label class="ml-2">
            <input type="radio" :value="false" v-model="uploadEnabled" /> OFF
          </label>
          <button class="btn-ui ml-2" :disabled="isProcessing" @click="updateUploadStatus">
            Update
          </button>
        </div>

        <h3 class="font-bold mt-5">Banned from Uploading</h3>
        <p>Members on this list will see a message stating they are banned on the Upload page.</p>
        <div class="my-2">
          <input type="text"
                 v-model="username"
                 class="input-text"
                 placeholder="Username"
                 maxlength="16" />
          <button class="btn-ui ml-2" :disabled="isProcessing || !username" @click="ban">
            Ban
          </button>
        </div>
        <div v-if="bans.length === 0">No members are banned from uploading.</div>
        <table v-else class="my-2">
          <tr>
            <th class="p-2 text-left">Username</th>
            <th class="p-2 text-left">Banned By</th>
            <th class="p-2 text-left">Date</th>
            <th class="p-2"></th>
          </tr>
          <tr v-for="ban in bans" :key="ban.member_id">
            <td class="p-2">{{ ban.username }}</td>
            <td class="p-2">{{ ban.banned_by_username }}</td>
            <td class="p-2">{{ new Date(ban.created_at).toLocaleDateString() }}</td>
            <td class="p-2">
              <button class="btn-ui" :disabled="isProcessing" @click="unban(ban.member_id)">
                Unban
              </button>
            </td>
          </tr>
        </table>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "DesignerHomesSettings",
  data: () => {
    return {
      loaded: false,
      uploadEnabled: true,
      bans: [],
      username: "",
      error: "",
      success: "",
      isProcessing: false,
    };
  },
  methods: {
    async getSettings(): Promise<void> {
      try {
        const response = await this.$http.get("/designer_home/settings");
        this.uploadEnabled = response.data.uploadEnabled;
        this.bans = response.data.bans;
      } catch (errorResponse: any) {
        this.error = errorResponse.response?.data?.error ?? "An unknown error occurred";
      }
      this.loaded = true;
    },
    async updateUploadStatus(): Promise<void> {
      await this.post(
        "/designer_home/upload_status",
        { enabled: this.uploadEnabled },
        "Settings updated successfully.",
      );
    },
    async ban(): Promise<void> {
      await this.post(
        "/designer_home/ban",
        { username: this.username },
        `${this.username} banned from uploading.`,
      );
      if(!this.error) this.username = "";
    },
    async unban(memberId): Promise<void> {
      await this.post("/designer_home/unban", { memberId }, "Ban removed.");
    },
    async post(endpoint, data, success): Promise<void> {
      if(this.isProcessing) return;
      this.error = "";
      this.success = "";
      this.isProcessing = true;
      try {
        await this.$http.post(endpoint, data);
        this.success = success;
      } catch (errorResponse: any) {
        this.error = errorResponse.response?.data?.error ?? "An unknown error occurred";
      }
      await this.getSettings();
      this.isProcessing = false;
    },
  },
  mounted() {
    this.getSettings();
  },
});
</script>
