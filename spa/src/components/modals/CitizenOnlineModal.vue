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
          <div class="pb-5" v-if="action">
            <h3 v-if="security.length > 0" style="color:red;"><b>Security Alerted!</b></h3>
            <p v-if="security.length === 0" style="width: 250px">
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
              Select a name to visit their home.
            </p>
            <p class="pb-5" style="width:250px">
              <b style="color: red;">Do you need to contact security?</b><br />
              If you do, <router-link :to="{path: `/place/jail`}" ><span @click="close('Modal closed')">Click Here</span></router-link> to navigate to the Jail and leave an inbox with the details for security.
              <!--Removed until functionality is added-->
              <!--Please use the Security Alert button only if you really have a security problem. You can leave a message for them at the Security In-box at the Jump Gate. 
              <span style="color:lime;">
                If you need help, you can call a City Guide using the button at the end of this list.
              </span>-->
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
            <!--Hidden until functionality is expanded upon. Needs to keep track of all alerts in case multiple happen at the same time.-->
            <!--<button class="btn-ui bold" style="width:auto;" @click="confirmSecurityAlert" v-show="!action"><font color='red' size="2rem">S e c u r i t y &nbsp; A l e r t</font></button>-->
            <div class="flex">
              <!--Hidden until functionality is added-->
              <!--<button class="btn-ui" @click="openMyMessages">My Messages</button>-->
              <button class="btn-ui" @click="refresh">Refresh</button>
            </div>
            <div class="flex">
              <!--Hidden until functionality is added-->
              <!--<button class="btn-ui" @click="openConfigure">Configure</button>-->
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
    confirmSecurityAlert(){
      ModalService.open(ConfirmAlertModal);
    },
    openConfigure(){
      ModalService.open(ConfigureModal);
    },
    openMyMessages(){
      ModalService.open(MyMessagesModal);
    },
    openMemberProfile(user){
      ModalService.open(MemberModal, {
        user: user
      });
    },
    alertSecurity(){
      let placeName = this.$store.data.place.name;
      let placeId = this.$store.data.place.id;
      let placeSlug = this.$store.data.place.slug;
      let placeType = this.$store.data.place.type;
      let placeOwner = this.$store.data.place.member_id;
      let user = this.$store.data.user.username;

      this.$socket.emit('security-alert', {
        user_name: user,
        place_name: placeName,
        place_id: placeId,
        place_slug: placeSlug,
        place_type: placeType,
        place_owner: placeOwner,
        alert_details: this.details,
      });
    },
    refresh(){
      this.users = [];
      this.security = [];
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
