<template>
  <Modal>
    <template v-slot:header>
        <button type="button" class="btn-ui-inline" @click="close('Modal closed')">X</button>
        <button type="button" class="btn-ui-inline" @click="openInfoModal">&lt;</button>
    </template>
    <template v-slot:body>
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
  </Modal>
</template>

<script lang="ts">
import Vue from "vue";

import Modal from './Modal.vue';
import ModalMixin from './mixins/ModalMixin';
import InfoModal from "./InfoModal.vue";
import ModalService from "./services/ModalService.vue";

export default Vue.extend({
  name: "TestModal",
  components: {Modal},
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
    openInfoModal(): void {
      ModalService.open(InfoModal);
    },
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
        this.$store.data.user.username = response.data.username;
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
    this.$http.get("/avatar")
      .then(response => {
        this.avatars = response.data.avatars;
      });

    this.avatarId = this.$store.data.user.avatar.id;
  },
  mixins: [ModalMixin],
});
</script>
