<template>
  <Modal>
    <template v-slot:header>
      <button type="button"
              class="btn-ui-inline"
              @click="close('Modal closed')">X</button>
      <button type="button"
              class="btn-ui-inline"
              @click="openInfoModal">&lt;</button>
    </template>
    <!-- avatars/avlib.html -->
    <template v-slot:body>
      <div class="flex-1">
        <h3 align="center">Update Your Avatar</h3>
        <p align="center"
           v-if="showError"
           class="text-red-500">{{ error }}</p>
        <p align="center"
           v-if="showSuccess"
           class="text-green"
           >
          Account Details Updated!
        </p>
        <div align="center">

          <button class="btn-ui"
                  @click="openAvatarUploadModal">Upload Avatar</button>
          <div class="grid lg:grid-cols-4 md:grid-cols-3 gap-6">
            <div v-for="(avatar, key) in avatars"
                 :key="key">
              <img :src="'/assets/avatars/' + avatar.directory + '/' + avatar.image"
                   style="max-width:100%;max-height:250px;height:auto;width:auto;" />
              <div>{{ avatar.name }}</div>
              <div class="text-green" v-if="avatar.id == avatarId">Current Avatar</div>
              <button v-else type="button"
                      class="btn-ui"
                      @click="save(avatar.id)">Use Avatar</button>
            </div>
          </div>
          <br />
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
import AvatarUploadModal from "./AvatarUploadModal.vue";
import ModalService from "./services/ModalService.vue";

export default Vue.extend({
  name: "AvatarModal",
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
    openAvatarUploadModal(): void {
      ModalService.open(AvatarUploadModal);
    },
    async save(id) {
      try {
        const response = await this.$http.post("/member/update_avatar", {
          avatarId: id,
        });
        this.$store.data.user.avatar.id = id;
        this.$store.methods.setToken(response.data.token);
        this.avatarId = id;
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
        this.avatars = response.data.avatars.reverse();
      });

    this.avatarId = this.$store.data.user.avatar.id;
  },
  mixins: [ModalMixin],
});
</script>
