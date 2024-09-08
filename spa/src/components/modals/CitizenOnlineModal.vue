<template>
  <ListModal>
    <template v-slot:header>
        <button type="button" class="btn-ui-inline" @click="close('Modal closed')">X</button>
    </template>
    <template v-slot:body>
        <div class="pb-5">
          <h1 align="center">Citizens Online</h1>
        </div>
        <div class="flex justify-center">
          <ul>
            <li v-for="user in users" :key="user.username">
              <router-link :to="{path: `/home/${user.username}`}" v-if="user.hasHome">
                <span @click="close('Modal closed')">
                  {{ user.username }}
                </span>  
              </router-link>
              <span class="text-white-600" v-else>{{ user.username }}</span>
            </li>
          </ul>
        </div>
    </template>
  </ListModal>
</template>

<script lang="ts">
import Vue from "vue";

import ListModal from './ListModal.vue';
import ModalMixin from './mixins/ModalMixin';
import ModalService from "./services/ModalService.vue";

export default Vue.extend({
  name: "CitizenOnlineModal",
  components: {ListModal},
  data: () => {
    return {
      users: [],
    };
  },
  methods: {
    async getOnlineMembers(){
      const onlineUsers = await this.$http.get("/member/online_users");
      this.users = onlineUsers.data.returnUsers;
    },
  },
  created(){
    this.getOnlineMembers();
  },
  mixins: [ModalMixin],
});
</script>
