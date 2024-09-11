<template>
  <Modal>
    <template v-slot:header>
        <button type="button" class="btn-ui-inline" @click="close('Modal closed')">X</button>
    </template>
    <template v-slot:body>
    <div class="grid" style="grid-template-rows: calc(100vh - 225px) 115px;">
      <div class="overflow-y-auto">
        <div class="pb-5">
          <h1 align="center">{{ users.length }} <span v-if="users.length > 1">Citizens</span><span v-else>Citizen</span> Online</h1>
        </div>
        <div class="flex-1 justify-center text-center">
          <div class="pb-5" v-if="securityAlerted">
            <p v-if="security.length === 0">
              There are no security online at this time. Please leave a message in the security in-box<br /> <router-link :to="{slug: `enter`}" >Security In-Box.</router-link>
            </p>
            <p v-else-if="security.length === 1">
              1 City Security Member Reached.
            </p>
            <p v-else>
              {{ security.length }} City Security Members Reached
            </p>
          </div>
          <div>
            <p class="pb-5">
              Select a name to send an instant message.
            </p>
            <p class="pb-5">
              Please use the Security Alert button only if you really have a security problem. You can leave a message for them at the Security In-box at the Jump Game. 
              <span style="color:lime;">
                If you need help, you can call a City Guide using the button at the end of this list.
              </span>
            </p>
          </div>
          <ul>
            <li v-for="user in users" :key="user.username">
              <span class="cursor-pointer" @click="openMemberProfile(user)">
                <span v-if="user.hasHome" style="color:lime;">{{ user.username }}</span>
                <span v-else>{{ user.username }}</span>
              </span>  
            </li>
          </ul>
        </div>
      </div>
      <div>
        <div >
          <div class="pt-5">
            <button class="btn-ui bold" style="width:auto;" @click="alertSecurity"><font color='red' size="2rem">S e c u r i t y &nbsp; A l e r t</font></button>
            <div class="flex">
              <button class="btn-ui" @click="openMessages">My Messages</button>
              <button class="btn-ui" @click="refresh">Refresh</button>
            </div>
            <div class="flex">
              <button class="btn-ui" @click="configure">Configure</button>
              <button class="btn-ui" @click="close('Modal closed')">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </template>
  </Modal>
</template>

<script lang="ts">
import Vue from "vue";
import ConfirmAlertModal from './ConfirmAlertModal.vue';
import Modal from './Modal.vue';
import ConfigureModal from './ConfigureModal.vue';
import MyMessagesModal from './MyMessagesModal.vue';
import MemberModal from './MemberModal.vue';
import ModalMixin from './mixins/ModalMixin';
import ModalService from "./services/ModalService.vue";

export default Vue.extend({
  name: "CitizenOnlineModal",
  components: {Modal},
  props: ["action", "details"],
  data: () => {
    return {
      users: [],
      security: [],
      securityAlerted: false,
    };
  },
  methods: {
    async getOnlineMembers(){
      const onlineUsers = await this.$http.get("/member/online_users");
      this.users = onlineUsers.data.returnUsers;
      this.users.forEach((user) => {
        if(user.security){
          this.security.push(user);
        }
      })
    },
    alertSecurity(){
      this.securityAlerted = true;
      // Add message/alert emit to all online security members containing username and place the member is alerting from.
    },
    refresh(){
      this.users = [];
      this.security = [];
      this.securityAlerted = false;
      this.getOnlineMembers();
    },
    openMessages(){
      // TO DO
      // Open last 25 messages received
    },
    configure(){
      // TO DO
      // Have options to add people to a friends list
      // Have option to be hidden/invisible
    },
  },
  created(){
    this.getOnlineMembers();
  },
  mounted(){
    if(this.action){
      this.alertSecurity();
    }
  },
  mixins: [ModalMixin],
});
</script>
