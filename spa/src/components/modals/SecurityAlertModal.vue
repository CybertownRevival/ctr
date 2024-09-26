<template>
  <NotificationModal>
    <template v-slot:header>
      <button type="button" class="btn-ui-inline" @click="close('Modal closed')">X</button>
      <h2 class="absolute left-0 px-2 font-bold">
        {{ new Date().toLocaleTimeString("en-US", {
          month: "numeric",
          day: "numeric",
          year: "numeric",
          timeZone: "America/New_York",
        }) }}
      </h2>
    </template>
    <template v-slot:body>
      <center><h1>NEW SECURITY ALERT</h1></center>
      <br />
      <div class="grid grid-cols-3">
        <div>
          <h3>
            <b>Alerting User: </b> 
            <span style="color: lime;">{{ data.user_name }}</span><br />
            <span v-if="['public', 'shop'].includes(data.place_type)"><b>Place:</b> </span>
            <span v-if="data.place_type === 'colony'"><b>Colony:</b> </span>
            <span v-if="data.place_type === 'hood'"><b>Neighborhood:</b> </span>
            <span v-if="data.place_type === 'block'"><b>Block:</b> </span>
            <span v-if="data.place_type === 'home'"><b>Home:</b> </span>
            {{ data.place_name }}<br />
            <b>Time:</b> {{ new Date().toLocaleTimeString("en-US", {
              month: "numeric",
              day: "numeric",
              year: "numeric",
              timeZone: "America/New_York",
            }) }}
            <br />
            <br />
            <span v-if="data.alert_details.user"><b>Person of interest: </b> <span  style="color: orange;">{{ data.alert_details.user }}</span></span><br />
            <b>Area(s) of Concern</b>
            <br/>
            <span v-if="data.alert_details.chat">Chat, </span>
            <span v-if="data.alert_details.messageboard">Messageboard Intro or Messages, </span>
            <span v-if="data.alert_details.inbox">Inbox Intro, </span>
            <span v-if="data.alert_details.home">Home Name, </span>
            <span v-if="data.alert_details.other">Other Reason</span>
          </h3>
          <br />
        </div>
        <div></div>
        <div>
          <router-link style="width:100%; text-decoration: none;" :to="{path: `/home/${placeOwner}`}" v-if="data.place_type === 'home'">
            <button class="btn-ui" style="text-decoration:none; width: 100%; height: 30px;" @click="close('Modal closed')">GO TO {{ data.user_name }}</button>
          </router-link>
          <router-link style="width:100%; text-decoration: none;" :to="{path: `/neighborhood/${data.place_id}`}" v-else-if="data.place_type === 'hood'">
            <button class="btn-ui" style="width: 100%; height: 30px;" @click="close('Modal closed')">GO TO {{ data.user_name }}</button>
          </router-link>
          <router-link style="width:100%; text-decoration: none;" :to="{path: `/block/${data.place_id}`}" v-else-if="data.place_type === 'block'">
            <button class="btn-ui" style="width: 100%; height: 30px;" @click="close('Modal closed')">GO TO {{ data.user_name }}</button>
          </router-link>
          <router-link style="width:100%; text-decoration: none;" :to="{path: `/place/${data.place_slug}`}" v-else-if="
            data.place_type === 'public' ||
            data.place_type === 'shop' ||
            data.place_type === 'colony'">
            <button class="btn-ui" style="width: 100%; height: 30px;" @click="close('Modal closed')">GO TO {{ data.user_name }}</button>
          </router-link>
          <br />
          <button class="btn-ui" style="width: 100%; height: 30px;">Message {{ data.user_name }}</button>
        </div>
      </div>
    </template>
  </NotificationModal>
</template>

<script lang="ts">
import Vue from "vue";

import NotificationModal from './NotificationModal.vue';
import ModalMixin from './mixins/ModalMixin';
import ModalService from "./services/ModalService.vue";

export default Vue.extend({
  name: "SecurityAlertModal",
  components: {NotificationModal},
  props: [
    "data"
  ],
  data: () => {
    return {
      placeOwner: null,
    };
  },
  methods: {
    async getHomeOwner(){
      const username = await this.$http.get(`/member/info/${this.data.place_owner}`);
      this.placeOwner = username.data.memberInfo.username;
    },
  },
  mounted(){
    if(this.data.place_type === 'home'){
      this.getHomeOwner();
    }
  },
  mixins: [ModalMixin],
});
</script>
