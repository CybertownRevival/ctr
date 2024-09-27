<template>
  <NotificationModal>
    <template v-slot:header>
      <button type="button" class="btn-ui-inline" @click="close('Modal closed')">X</button>
    </template>
    <template v-slot:body>
      <center>
        <h3>My Recent Messages</h3>
        <button class="btn-ui" @click="openCitizenOnlineList">Back</button>
      </center>
    </template>
  </NotificationModal>
</template>

<script lang="ts">
import Vue from "vue";
import CitizenOnlineModal from './CitizenOnlineModal.vue';
import NotificationModal from './NotificationModal.vue';
import ModalMixin from './mixins/ModalMixin';
import ModalService from "./services/ModalService.vue";

export default Vue.extend({
  name: "MyMessagesModal",
  components: {NotificationModal},
  data: () => {
    return {
      
    };
  },
  methods: {
    openCitizenOnlineList(){
      ModalService.open(CitizenOnlineModal);
    },
  },
  mounted(){

  },
  mixins: [ModalMixin],
});
</script>
