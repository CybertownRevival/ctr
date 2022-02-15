<template>
  <div class="flex-1">
    <h3 align="center">Update Your Account Information</h3>
    <p align="center" v-if="showError" class="text-red-500">{{ error }}</p>
    <p align="center" v-if="showSuccess" color="#00FF00">
      Account Details Updated!
    </p>
    <div align="center">
      <table border="0">
        <tr>
          <td colspan="2" class="text-center">
            <font color="#00FF00" size="+1">Change your password</font>
          </td>
        </tr>
        <tr>
          <td><b>Current Password</b></td>
          <td>
            <input type="password" v-model="currentPassword" size="20" />
          </td>
        </tr>
        <tr>
          <td><b>New Password</b></td>
          <td>
            <input type="password" v-model="newPassword" size="20" />
          </td>
        </tr>
        <tr>
          <td><b>New Password (again)</b></td>
          <td>
            <input type="password" v-model="newPassword2" size="20" />
          </td>
        </tr>
      </table>

      <button type="button" class="btn" @click="save">Update Password</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: "AccountPage",
  data: () => {
    return {
      currentPassword: "",
      newPassword: "",
      newPassword2: "",
      showError: false,
      error: "",
      showSuccess: false,
    };
  },
  methods: {
    async save() {
      this.showError = false;
      this.showSuccess = false;

      if (this.newPassword !== this.newPassword2) {
        this.error = "Please enter your new password the same twice.";
        this.showError = true;
        return;
      }

      try {
        let response = await this.$http.post("/member/update_password", {
          currentPassword: this.currentPassword,
          newPassword: this.newPassword,
          newPassword2: this.newPassword2,
        });
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
  mounted() {},
});
</script>
