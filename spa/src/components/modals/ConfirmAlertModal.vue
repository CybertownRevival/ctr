<template>
  <Modal>
    <template v-slot:header>
      <button type="button" class="btn-ui-inline" @click="close('Modal closed')">X</button>
    </template>
    <template v-slot:body>
      <center>
        <h1>Please select the reason you're alerting security</h1><br />
        <div class="grid grid-cols-3" style="width:600px;">
          <div>
            <input type="checkbox" id="chat" v-model="chat" />
            <label for="chat"> User Chat</label>
          </div>
          <div>
            <input type="checkbox" id="messageboard" v-model="messageboard" />
            <label for="messageboard"> Messageboard</label>
          </div>
          <div>
            <input type="checkbox" id="inbox" v-model="inbox" />
            <label for="inbox"> Inbox Intro</label>
          </div>
          <div>
            <input type="checkbox" id="home" v-model="home" />
            <label for="home"> Home Name</label>
          </div>
          <div>
            <input type="checkbox" id="other" v-model="other" />
            <label for="other"> Other Reason</label>
          </div>
        </div>
        <br/>
        <h2 v-if="!addUsername">
          <input class="hidden" type="checkbox" id="addUsername" v-model="addUsername" />
          <label for="addUsername">Click here to add the username of the offending user</label>
        </h2>
        <h2 v-else>
          <label for="username">Enter their username</label><br />
          <input type="text" id="username" v-model="user" style="color:black;" />
        </h2>
        <br />
        <div class="flex" style="width:250px;">
          <button class="btn-ui" @click="action(true)">Send</button><button class="btn-ui" @click="action(false)">Cancel</button>
        </div>
      </center>
    </template>
  </Modal>
</template>

<script lang="ts">
import Vue from "vue";
import CitizenOnlineModal from './CitizenOnlineModal.vue';
import Modal from './Modal.vue';
import ModalMixin from './mixins/ModalMixin';
import ModalService from "./services/ModalService.vue";

export default Vue.extend({
  name: "ConfirmAlertModal",
  components: {Modal},
  data: () => {
    return {
      addUsername: false,
      user: null,
      chat: false,
      messageboard: false,
      inbox: false,
      home: false,
      other: false,
    };
  },
  methods: {
    action(response){
      if(![this.chat, this.messageboard, this.inbox, this.home].includes(true)){
        this.other = true;
      }
      ModalService.open(CitizenOnlineModal, {
        action: response,
        details: {
          user: this.user,
          chat: this.chat,
          messageboard: this.messageboard,
          inbox: this.inbox,
          home: this.home,
          other: this.other
        }
      });
    },
  },
  mounted(){

  },
  mixins: [ModalMixin],
});
</script>
