<template>
  <Modal>
    <template v-slot:header>
      <button type="button" class="btn-ui-inline" @click="close('Modal closed')">X</button>
    </template>
    <template v-slot:body>
      <center>
        <div v-if="view === 'main'">
          <h1>Configure Messaging System</h1>
          <br />
          <div class="flex w-72">
            <button class="btn-ui" @click="openBuddiesList">Buddy List</button>
            <button class="btn-ui" @click="openBlockedList">Blocked List</button>
          </div>
          <br />
          Current Mode<br/>
          <input type="checkbox" id="visible" v-model="visible" class="hidden" @change="changeMode" />
          <label for="visible" class="cursor-pointer" style="color:lime;" v-if="visible"><b>You Are Visible</b></label>
          <label for="visible" class="cursor-pointer" style="color:gray;" v-else><b>You Are Hidden</b></label>
          <br />
          <i>(click to change modes)</i>
          <br />
          <br />
          <button class="btn-ui" @click="openCitizenOnlineList">Back</button>
        </div>
        <div style="width:600px;" v-if="view === 'buddies'">
          <h1>Edit Buddy List</h1>
          <br />
          <h3>Add the username of your friends so you can get notified when they come online</h3>
          <br />
          <div class="grid grid-cols-5 gap-0.5 text-black">
            <input type="text" v-model="buddyList[0]" />
            <input type="text" v-model="buddyList[1]" />
            <input type="text" v-model="buddyList[2]" />
            <input type="text" v-model="buddyList[3]" />
            <input type="text" v-model="buddyList[4]" />
            <input type="text" v-model="buddyList[5]" />
            <input type="text" v-model="buddyList[6]" />
            <input type="text" v-model="buddyList[7]" />
            <input type="text" v-model="buddyList[8]" />
            <input type="text" v-model="buddyList[9]" />
          </div>
          <br />
          <button class="btn-ui" @click="saveBuddyList">Save</button>
        </div>
        <div style="width:600px;" v-if="view === 'blocked'">
          <h1>Edit Blocked List</h1>
          <br />
          <h3>Add the username of people you no longer want to receive messages from.</h3>
          <br />
          <div class="grid grid-cols-5 gap-0.5 text-black">
            <input type="text" v-model="blockedList[0]" />
            <input type="text" v-model="blockedList[1]" />
            <input type="text" v-model="blockedList[2]" />
            <input type="text" v-model="blockedList[3]" />
            <input type="text" v-model="blockedList[4]" />
            <input type="text" v-model="blockedList[5]" />
            <input type="text" v-model="blockedList[6]" />
            <input type="text" v-model="blockedList[7]" />
            <input type="text" v-model="blockedList[8]" />
            <input type="text" v-model="blockedList[9]" />
          </div>
          <br />
          <button class="btn-ui" @click="saveBlockedList">Save</button>
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
  name: "ConfigureModal",
  components: {Modal},
  data: () => {
    return {
      visible: true,
      buddyList: ["", "", "", "", "", "", "", "", "", "",],
      blockedList: ["", "", "", "", "", "", "", "", "", "",],
      view: "main",
    };
  },
  methods: {
    openCitizenOnlineList(){
      ModalService.open(CitizenOnlineModal);
    },
    openBuddiesList(){
      // TO DO
      // Pull buddy list and populate the array.
      this.view = "buddies";
    },
    openBlockedList(){
      // TO DO
      // Pull blocked list and populate the array.
      this.view = "blocked";
    },
    openMain(){
      this.buddyList = ["", "", "", "", "", "", "", "", "", "",];
      this.blockedList = ["", "", "", "", "", "", "", "", "", "",];
      this.view = "main";
    },
    saveBuddyList(){
      // TO DO
      // Save list in the DB
      this.openMain();
    },
    saveBlockedList(){
      // TO DO
      // Save list in the DB
      this.openMain();
    },
    changeMode(){
      // TO DO
      // Save status in DB.
    }
  },
  mounted(){

  },
  mixins: [ModalMixin],
});
</script>
