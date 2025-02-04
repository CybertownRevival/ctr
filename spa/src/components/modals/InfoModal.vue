<template>
  <Modal>
    <template v-slot:header>
        <button type="button" class="btn-ui-inline" @click="close('Modal closed')">X</button>
    </template>
    <template v-slot:body>
        <div>
          <h3 align="center">My Home - My Information</h3>
          <p align="center">Here you can change your personal information, e.g. email address,
            first name, last name, short info for the citizen directory. And you could visit your
            private house.<br></p>

          <div align="center">
            <table border="0">
              <tr>
                <td width="200" align="center">
                  <a href="#" @click.prevent="openPersonalInfoModal">
                    <img src="/assets/img/icon_myinfo.jpg" border=0><br><b>Personal Info</b>
                  </a>
                </td>
                <td width=200 align=center>
                  <img src="/assets/img/icon_myhouse.jpg" border=0><br><b>Visit My House</b>
                </td>
                <td width=200 align=center>
                  <a href="#" @click.prevent="openAvatarModal">
                    <img src="/assets/img/icon_myinfo.jpg" border=0><br><b>My Avatar</b>
                  </a>
                </td>
              </tr>
            </table>
            <table>
              <tr>
                <td width=200 align=center>
                  <a href="#" @click.prevent="openAccountModal">
                    <img src="/assets/img/icon_myinfo.jpg" border=0><br><b>My Account</b>
                  </a>
                </td>
                <td width=200 align=center>
                  <a href="#" @click.prevent="openAvatarModal">
                    <img src="/assets/img/icon_myinfo.jpg" border=0><br><b>Avatar Library</b>
                  </a>
                </td>
              </tr>
            </table>
            <br>
            To access and set up your Instant Message Center,
            click on the Online Citizens link under City Time in the right frame.
            <br><br><br>
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
import AccountModal from "./AccountModal.vue";
import ModalService from "./services/ModalService.vue";
import PersonalInfoModalVue from './PersonalInfoModal.vue';

export default Vue.extend({
  name: "InfoModal",
  components: {Modal},
  methods: {
    openAvatarModal(): void {
      ModalService.open(AvatarModal);
    },
    openAccountModal(): void {
      ModalService.open(AccountModal);
    },
    openPersonalInfoModal(): void {
      ModalService.open(PersonalInfoModalVue);
    },
  },
  mixins: [ModalMixin],
});
</script>
