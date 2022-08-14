<template>
  <Modal>
    <template v-slot:header>
        <button type="button" class="btn-ui-inline" @click="close('Modal closed')">X</button>
        <button type="button" class="btn-ui-inline" @click="openInfoModal"><</button>
    </template>
    <template v-slot:body>
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
  </Modal>
</template>

<script lang="ts">
import Vue from "vue";

import Modal from './Modal.vue';
import ModalMixin from './mixins/ModalMixin';

import InfoModal from "./InfoModal.vue"
import ModalService from "./services/ModalService.vue"

export default Vue.extend({
  name: "AccountModal",
  components: {Modal},

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
    async save(): Promise<void> {
      this.showError = false;
      this.showSuccess = false;

      if (this.newPassword !== this.newPassword2) {
        this.error = "Please enter your new password the same twice.";
        this.showError = true;
        return;
      }

      try {
        await this.$http.post("/member/update_password", {
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
    openInfoModal(): void {
      ModalService.open(InfoModal);
    },
  },
  mounted() {},
  mixins: [ModalMixin],
});
</script>