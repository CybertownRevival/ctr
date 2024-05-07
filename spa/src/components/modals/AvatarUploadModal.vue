<template>
  <Modal>
    <template v-slot:header>
      <button type="button"
              class="btn-ui-inline"
              @click="close('Modal closed')">X</button>
      <button type="button"
              class="btn-ui-inline"
              @click="back">&lt;</button>
    </template>
    <template v-slot:body>
      <div class="flex-1">
        <h3 align="center">Upload an Avatar</h3>
        <p align="center"
           v-if="showError"
           class="text-red-500">{{ error }}</p>
        <p align="center"
           v-if="showSuccess"
           color="#00FF00">
          Avatar uploaded, pending approval!
        </p>
        <div align="center" v-if="showForm">
          <p>Upload your own avatar file to be used in Cybertown Revival. You can also choose to allow other members to use it
            too. All avatars uploaded will require approval by the Admins before being made available.</p>
          <table>
            <tr>
              <td>Avatar VRML File:</td>
              <td><input type="file"
                       size="32"
                       class="mb-2"
                       @change="setFile"
                       data-id="wrlFile"
                       accept=".wrl"></td>
            </tr>
            <tr>
              <td>Avatar Texture File:</td>
              <td><input type="file"
                       size="32"
                       class="mb-2"
                       @change="setFile"
                       data-id="textureFile"
                       accept=".jpeg"></td>
            </tr>
            <tr>
              <td>Avatar Thumbnail File:</td>
              <td><input type="file"
                       size="32"
                       class="mb-2"
                       @change="setFile"
                       data-id="imageFile"
                       accept=".jpeg"></td>
            </tr>
            <tr>
              <td>Avatar Name:</td>
              <td><input type="text"
                       class="input-text mb-2"
                       maxlength="64"
                       size="32"
                       v-model="name"></td>
            </tr>
            <tr>
              <td>Gestures List (optional):</td>
              <td><input type="text"
                       class="input-text mb-2"
                       maxlength="64"
                       size="32"
                       placeholder="Example: Hello, GoodBye, Cool"
                       v-model="gestures"></td>
            </tr>
            <tr>
              <td>Usage Access:</td>
              <td>
                <select class="mb-2"
                        v-model="avatarPrivate">
                  <option v-for="(option, key) in avatarPrivateOptions"
                          :value="option.value"
                          :key="key">
                    {{ option.label }}
                  </option>
                </select>
              </td>
            </tr>
          </table>
          <button type="button"
                  class="btn"
                  @click="upload"
                  v-if="showForm">Upload Avatar</button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script lang="ts">
import Vue from "vue";
import Modal from './Modal.vue';
import ModalMixin from './mixins/ModalMixin';
import AvatarModal from "./AvatarModal.vue";
import ModalService from "./services/ModalService.vue";

export default Vue.extend({
  name: "AvatarUploadModal",
  components: { Modal },
  data: () => {
    return {
      showError: false,
      showSuccess: false,
      showForm: true,
      error: "",
      name: '',
      gestures: '',
      wrlFile: {},
      imageFile: {},
      textureFile: {},
      avatarPrivate: '',
      avatarPrivateOptions: [
        {
          value: '',
          label: 'Select One',
        },
        {
          value: 0,
          label: 'Anyone',
        },
        {
          value: 1,
          label: 'Only Me',
        }
      ],
    };
  },
  methods: {
    back(): void {
      ModalService.open(AvatarModal);
    },
    setFile(e) {
      let files = e.target.files || e.dataTransfer.files;
      this[e.target.dataset.id] = files[0];
    },
    async upload(): Promise<void> {
      this.showError = false;
      this.showSuccess = false;
      try {
        await this.$http.post("/avatar/upload", {
          name: this.name,
          wrlFile: this.wrlFile,
          textureFile: this.textureFile,
          imageFile: this.imageFile,
          gestures: this.gestures,
          private: this.avatarPrivate
        }, true);
        this.showSuccess = true;
        this.showForm = false;
      } catch (errorResponse: any) {
        if (errorResponse.response.data.error) {
          this.error = errorResponse.response.data.error;
          this.showError = true;
        } else {
          this.error = "An unknown error occurred";
          this.showError = true;
        }
      }
    }
  },
  mounted() {
  },
  mixins: [ModalMixin],
});
</script>
