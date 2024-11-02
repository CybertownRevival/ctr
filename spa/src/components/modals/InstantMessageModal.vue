<template>
  <Modal>
    <template v-slot:header>
      <button type="button" class="btn-ui-inline" @click="close('Modal closed')">X</button>
    </template>
    <template v-slot:body>
      <center>
        <div v-if="user || userData">
          <h3>Send an instant message to {{ userData.username }}</h3>
          <br />
          Type your message here
          <br />
          <textarea style="width: 600px; height:130px;" v-model="message"></textarea>
          <div class="flex w-96">
            <button class="btn-ui" v-if="user" @click="openMemberModal">Cancel</button>
            <button class="btn-ui" v-else @click="close('Modal closed')">Cancel</button>
            <button class="btn-ui" @click="sendMessage">Send Message </button>
          </div>
        </div>
        <div v-else>
          <h3>You received a message from </h3>
          <div>Message</div><br />
          <div class="flex w-96">
            <button class="btn-ui" @click="close('Modal closed')">Close</button>
            <button class="btn-ui" @click="reply">Reply</button>
          </div>
        </div>    
      </center>
    </template>
  </Modal>
</template>

<script lang="ts">
import Vue from "vue";
import MemberModal from './MemberModal.vue';
import Modal from './Modal.vue';
import ModalMixin from './mixins/ModalMixin';
import ModalService from "./services/ModalService.vue";

export default Vue.extend({
  name: "InstantMessageModal",
  components: {Modal},
  props: ["user"],
  data: () => {
    return {
      userData: null,
      view: "respond",
      message: "",
    };
  },
  methods: {
    openMemberModal(){
      ModalService.open(MemberModal, {
        user: this.user
      });
    },
    reply(){
      this.userData = {username: "test"};
    },
    sendMessage(){
      // TO DO
      // Add functionality and emit to server.
      ModalService.open(MemberModal, {
        user: this.user,
        status: "success"
      })
    },
  },
  mounted(){
    if(this.user){
      this.userData = this.user;
    }
  },
  mixins: [ModalMixin],
});
</script>
