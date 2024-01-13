<template>
<main class="flex w-full h-full">
  <div class="flex-col w-56 h-full border-r-2 border-white text-center">
    <div class="pt-3">Admin Panel</div>
    <div class="p-3"><hr></div>
    <div class="mb-2"><router-link class="btn-ui" :to="{name: 'UserSearch'}">Members</router-link></div>
    <div class="btn-ui">Places</div>
  </div>
  <div class="w-11/12 h-full p-1 overflow-y-scroll"><router-view :superAdmin="superAdmin" /></div>
</main>
</template>
<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "admin",
  data: () => {
    return {
      superAdmin: false,
      admin: false,
    };
  },
  methods: {
    async getAdmin(): Promise<void> {
      try{
        this.superAdmin = false;
        this.admin = false;
        await this.$http.get("/member/getAdminLevel")
          .then((response) => {
            console.log(response.data);
            this.admin = response.data.admin;
            this.superAdmin = response.data.superAdmin;
            if (!this.admin){
              this.$router.push({name: "restrictedaccess"});
            }
          });
      } catch (e) {
        console.log(e);
      }
    },
  },
  mounted() {
    this.getAdmin();
  },
});
</script>
