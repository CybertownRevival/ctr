<template>
  <div class="flex-1">
    <h3 align="center">Update Your Avatar</h3>
    <p align="center" v-if="showError" class="text-red-500">{{ error }}</p>
    <p align="center" v-if="showSuccess" color="#00FF00">
      Account Details Updated!
    </p>
    <div align="center">
      <select v-model="avatarId">
        <option v-for="avatar in avatars" :value="avatar.id" :key="avatar.id">
          {{ avatar.name }}
        </option>
      </select>
      <br />
      <button type="button" class="btn" @click="save">Update Avatar</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "AvatarPage",
  data: () => {
    return {
      avatarId: null,
      avatars: [],
      showError: false,
      showSuccess: false,
      error: "",
    };
  },
  methods: {
    async save() {
      this.showError = false;
      //todo validate a value
      if (this.avatarId === null || this.avatarId <= 0) {
        this.error = "Please select an avatar";
        this.showError = true;
        return;
      }

      try {
        const response = await this.$http.post("/member/update_avatar", {
          avatarId: this.avatarId,
        });
        this.$store.data.user.userName = response.data.username
        this.$store.methods.setToken(response.data.token);
        this.showSuccess = true;
      } catch (errorResponse: any) {
        if (errorResponse.response.data.error) {
          this.error = errorResponse.response.data.error;
          this.showError = true;
        } else {
          this.error = "An unknown error occurred";
          this.showError = true;
        }
      }
    },
  },
  mounted() {
    //todo get the list of public avatars
    this.$http
      .get("/avatar", {
        limit: 1000,
      })
      .then(response => {
        this.avatars = response.data.avatars;
      });

    //todo set avatarId = user's avatar id
    this.avatarId = this.$store.data.user.avatar.id;
  },
},);
</script>
