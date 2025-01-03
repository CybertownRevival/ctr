<template>
  <div class="flex flex-col items-center justify-center w-full">
    <div class="text-center mb-3 w-1/2 text-xl">
      Hire Roles
    </div>
    <div class="text-center mb-3 w-1/2 text-yellow-200 border-2 border-red-500">
      This is to give roles to a user.  Most roles are title only with no access.  However,
      Mayor; Deputy Mayor; Colony Leader; and all Security titles come with access rights
      to this Admin Panel, so be mindful with who you give what roles to.
    </div>
    <div class="text-center mb-3 w-1/2">
      <select class="mr-3" v-model="roleSelector">
        <option value="first">---Select Role to Hire---</option>
        <option v-for="role in roles" :key="role.id" :value="role.id">
          {{ role.name }}
        </option>
      </select>
    </div>
    <div class="text-center w-1/2 mb-3 mr-3">
      <span class="text-red-500" v-if="error">
        {{error}}
      </span>
      <span class="text-chat" v-else-if="success">
        {{success}}
      </span>
      <span class="text-chat" v-else>
        &nbsp;
      </span>
    </div>
    <div class="text-center w-1/2 mb-3">
      <button class="btn" @click="hireRole">Hire</button>
    </div>
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
  props: ["accessLevel"],
  methods: {
    async hireRole(): Promise<void> {
      if (this.roleSelector === "first") {
        this.error = "Please select a role";
        return;
      }
      try {
        await this.$http.post("/admin/hirerole", {
          member_id: this.$route.params.id,
          role_id: this.roleSelector,
        });
        // Handle success here
        this.error = null;
        this.success = "Hiring was successful";
      } catch (error) {
        // Handle error here
        this.success = null;
        this.error = "An error occurred";
      }
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
    if (!this.accessLevel.includes("mayor")) {
      this.$router.push({ name: "restrictedaccess" });
    }
    this.getRoleList();
  },
});
</script>
