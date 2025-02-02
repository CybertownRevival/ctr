<template>
  <div class="grid grid-cols-1 w-8/12 items-center justify-center">
    <div class="grid grid-cols-1 w-full items-center justify-center">
      <div class="grid grid-cols-12 border-2 border-white p-1 w-full content-center">
        <div class="text-center col-span-3 font-bold">
          Banned On
        </div>
        <div class="text-center col-span-3 font-bold">
          Duration
        </div>
        <div class="text-center col-span-3 font-bold">
          Ban Type
        </div>
        <div class="text-center col-span-3 font-bold">
          Banned By
        </div>
        <div class="text-center col-span-3">
          {{ new Date().toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "America/New_York",
        }) }}
        </div>
        <div class="text-center col-span-3">
          <select v-model="banDuration">
            <option value="0">Warning</option>
            <option value="3">3 days</option>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="365242.5">Indefinite</option>
          </select>
        </div>
        <div class="text-center col-span-3">
          <select v-model="banType">
            <option value="jail">Jail</option>
            <option value="full">Full</option>
          </select>
        </div>
          <div class="text-center col-span-3">
            {{ $store.data.user.username }}
          </div>
          <div class="text-center col-span-12 mt-1">
            Reason
          </div>
        <div class="flex items-center justify-center col-span-12">
          <div class="flex items-center justify-center">
            <textarea class="text-black"
              v-model="banReason"
              rows="8"
              cols="100"></textarea>
          </div>
        </div>
          <div class="text-center col-span-12 my-1">
            <button class="btn" @click="addBan">Add Ban</button>
          </div>
        <div class="text-center col-span-12 text-chat" v-show="success">
          {{ success }}
        </div>
        <div class="text-center col-span-12 text-red-600" v-show="error">
          {{ error }}
        </div>
        </div>
      </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "UserBanAdd",
  data() {
    return {
      banDuration: 0,
      banType: "jail",
      banReason: "",
      success: "",
      error: "",
    };
  },
  props: [
    "accessLevel",
  ],
  methods:{
    async addBan(): Promise <void>{
      try {
        await this.$http.post("/admin/ban", {
          ban_member_id: this.$route.params.id,
          time_frame: this.banDuration,
          type: this.banType,
          reason: this.banReason,
        })
          .then(() => {
            this.success = "Ban Added";
            this.emitModerationEvent();
          });
      } catch (e) {
        this.error = e.response.data.message;
      }
    },
    emitModerationEvent(){
    this.$socket.emit('moderation', {
      member_id: this.$route.params.id,
    });
  },
  },
  created() {
    if (!this.accessLevel.includes("security")) {
      this.$router.push({name: "restrictedaccess"});
    }
  },
});
</script>
