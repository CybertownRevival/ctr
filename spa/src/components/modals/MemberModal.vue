<template>
  <Modal>
    <template v-slot:header>
      <button type="button" class="btn-ui-inline" @click="close('Modal closed')">X</button>
    </template>
    <template v-slot:body>
      <center>
        <div style="color:lime;" v-if="messageSent">{{ messageSent }}</div>
        <h3>{{ user.username }}</h3>
        <br />
        <div class="flex w-72">
          <!--Hidden until functionality is added-->
          <!--<button class="btn-ui no" @click="sendMessage">Send Message</button>-->
          <router-link style="text-decoration: none;" :to="{path: `/home/${user.username}`}" v-if="user.hasHome">
            <button class="btn-ui" @click="close('Modal closed')">
              Visit Home
            </button>  
          </router-link>
          <div class="flex w-full justify-center" v-else>User does not have a home</div>
        </div>
        
        <br />
        <button class="btn-ui" @click="openCitizenOnlineList">Back</button>
      </center>
    </template>
  </Modal>
</template>

<script lang="ts">
import Vue from "vue";
import CitizenOnlineModal from './CitizenOnlineModal.vue';
import Modal from './Modal.vue';
import InstantMessageModal from './InstantMessageModal.vue';
import ModalMixin from './mixins/ModalMixin';
import ModalService from "./services/ModalService.vue";

export default Vue.extend({
  name: "MemberModal",
  components: {Modal},
  props: ["user", "status"],
  data: () => {
    return {
      messageSent: ""
    };
  },
  methods: {
    openCitizenOnlineList(){
      ModalService.open(CitizenOnlineModal);
    },
    sendMessage(){
      ModalService.open(InstantMessageModal, {
        user:this.user
      });
    },
  },
  mounted(){
    if(this.status){
      this.messageSent = "Message has been sent!";
      setTimeout(()=>{
        this.messageSent = "";
      }, 2000);
    }
  },
  mixins: [ModalMixin],
});
</script>
