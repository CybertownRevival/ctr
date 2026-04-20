<template>
  <Modal>
    <template v-slot:header>
        <button type="button" class="btn-ui-inline" @click="close('Modal closed')">X</button>
        <button type="button" class="btn-ui-inline" @click="openInfoModal"><</button>
    </template>
    <template v-slot:body>
      <div class="flex-1 text-center" v-if="removeAccount">
        <h1 style="color:red;"><b>NOTICE!</b></h1>
        <h1 style="color:red;">This will perminately delete your account!</h1>
        <br />
        <h2>You will lose all experience points, cc's, or items on this account.</h2>
        <h2>Once this is confirmed, it cannot be undone. The account and anything associated with the account will no longer exist in the database.</h2>
        <br />
        <h3>Are you sure you want to perminately delete your account?</h3>
        <br />
        <div>
          <button type="button" class="btn" style="width:100px;" @click="confirmRemoval">Yes</button>
          <button type="button" class="btn" style="width:100px;" @click="cancelRemoval">No</button>
        </div>
      </div>
      <div class="flex-1" v-else>
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
          <br /><br />
          <button type="button" class="btn" style="background-color: darkred; color:white;" @click="remove">Perminately Delete Account</button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script lang="ts">
import Vue from "vue";

import Modal from './Modal.vue';
import ModalMixin from './mixins/ModalMixin';

import InfoModal from "./InfoModal.vue";
import ModalService from "./services/ModalService.vue";

export default Vue.extend({
  name: "AccountModal",
  components: {Modal},
  props: {
    close: {
      type: Function,
      required: true,
    },
  },

  data: () => {
    return {
      currentPassword: "",
      newPassword: "",
      newPassword2: "",
      showError: false,
      error: "",
      showSuccess: false,
      removeAccount: false,
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
     remove() {
      this.removeAccount = true;
     },
     confirmRemoval() {
      const confirmed = window.confirm("Are you absolutely sure you want to permanently delete your account?");

      if (confirmed) {
        this.deleteAccount();
        return;
      }

      this.cancelRemoval();
     },
     async deleteAccount(): Promise<void> {
      await this.$http.get("/object_instance/move_all_objects");
      await this.$http.get("/object/remove_account");
      await this.$http.get("/message/remove_all_messages");
      await this.$http.get("/inbox/remove_all_messages");
      await this.$http.get("/messageboard/remove_all_messages");
      await this.$http.get("/avatar/remove_all_avatars");
      await this.$http.get("/club/remove_account")
      await this.$http.get("/place/remove_account");      
      const removeAccount = await this.$http.get("/member/remove_account");
      if(removeAccount){
        this.close("Modal closed");
        this.$router.push("/logout");
      } else {
        console.log("Account Removal Failed.")
      }
     },
     cancelRemoval() {
      this.removeAccount = false;
     },
    openInfoModal(): void {
      ModalService.open(InfoModal);
    },
  },
  mounted() {},
  mixins: [ModalMixin],
});
</script>
