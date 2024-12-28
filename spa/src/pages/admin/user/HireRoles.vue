<template>
  <div>
    <div class="mb-3">
      Roles
    </div>
    <select class="mr-3" v-model="roleSelector">
      <option value="first">---Select Role to Hire---</option>
      <option v-for="role in roles" :key="role.id" :value="role.id">
        {{ role.name }}
      </option>
    </select>
    <div class="text-red-600" v-show="error">
      {{error}}
    </div>
    <button class="btn" @click="hireRole">Hire</button>
  </div>
  </template>
  
  <script lang="ts">
  import Vue from "vue";
  export default Vue.extend({
    name: "UserHireRoles",
    data() {
      return {
        roleSelector: "first",
        error: null,
        roles: [],
        success: null,
      };
    },
    props: ['accessLevel'],
    methods: {
      async hireRole(): Promise<void> {
        await this.$http.post("/admin/hirerole", {
          member_id: this.$route.params.id,
          role_id: this.roleSelector,
        });
      },
      async getRoleList(): Promise<void> {
        try {
          const response = await this.$http.get("/admin/rolelist/");
           response.data.roles.forEach(role => {
            if (
                (role.name === "Champion" ||
                role.name === "Devotee" ||
                role.name === "Advocate" ||
                role.name === "Supporter" ||
                role.name === "Admin") &&
                !this.accessLevel.includes("admin")
               ) {
                return;
                } else {
                this.roles.push(role);
             }
            });
        } catch (e) {
          this.error = e;
        }
      },
    },
    mounted() {
      if (!this.accessLevel.includes('mayor')) {
        this.$router.push({ name: "restrictedaccess" });
      }
      this.getRoleList();
    },
  });
  </script>
  