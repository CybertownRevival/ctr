<template>
  <Modal>
    <template v-slot:header>
      <button type="button" class="btn-ui-inline" @click="close('Modal closed')">X</button>
      <button type="button" class="btn-ui-inline" @click="backToInfoModal">&lt;</button>
    </template>
    <template v-slot:body>
      <div class="flex-1">
        <h3 class="text-center text-2xl">Personal Info</h3>
        <table border=0 width=100% class="text-2xl">
          <tr>
              <td><b>Name</b></td>
              <td>{{ info.username}}</td>
            </tr>
            <tr>
              <td><b>Email</b></td>
              <td>{{ info.email }}</td>
            </tr>
            <tr>
              <td><b>Immigration</b></td>
              <td>{{ info.immigrationDate | dateFormatFilter }}</td>
            </tr>
            <tr>
              <td><b>Experience</b></td>
              <td>{{ info.xp }} xp</td>
            </tr>
            <tr>
              <td><b>Money</b></td>
              <td>{{ info.walletBalance }} CC</td>
            </tr>
        </table>
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
    name: "PersonalInfoModal",
    components: {Modal},
    async created() {
      const { data } = await this.$http.get('/member/info');
      this.info = data.memberInfo;
    },
    data: () => {
      return {
        info: {
          username: undefined,
          email: undefined,
          immigrationDate: undefined,
          walletBalance: undefined,
          xp: undefined,
        }
      };
    },
    methods: {
      backToInfoModal(): void {
        ModalService.open(InfoModal);
      },
    },
    mixins: [ModalMixin],
  });
</script>