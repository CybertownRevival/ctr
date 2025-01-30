<template>
  <div class="flex-1">
    <div class="flex w-full justify-center p-5">
      <h1>
        City Roles
      </h1>
    </div>
    <div class="flex w-full justify-center p-5">
      <table>
        <tr>
          <th>ID</th>
          <th class="text-left" style="min-width: 200px;">Role Title</th>
          <th style="min-width: 100px;"></th>
          <th style="min-width: 100px;">Status</th>
          <th></th>
        </tr>
        <tr class="border" v-for="role in cityRoles" :key="role.id">
          <td class="p-5 text-center">{{ role.id }}</td>
          <td>{{ role.name }}</td>
          <td class="py-2">
            <table>
              <tr>
                <td class="italic">Weekly Pay: </td>
                <td class="text-center font-bold px-2">{{ role.income_cc }} cc</td>
              </tr>
              <tr>
                <td class="italic">Weekly xp: </td>
                <td class="text-center font-bold px-2">{{ role.income_xp }} xp</td>
              </tr>
              <tr v-if="role.required_xp >= 1">
                <td class="text-green italic">Minimum XP: </td>
                <td class="text-green text-center font-bold px-2">{{ role.required_xp }} xp</td>
              </tr>
            </table>
          </td>
          <td class="text-center font-bold text-green" v-if="role.active === 1">{{ status[role.active] }}</td>
          <td class="text-center italic" v-else>{{ status[role.active] }}</td>
          <td><button class="btn-ui" v-if="accessLevel.includes('admin')">Update</button></td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  name: "CityRoles",
  data: () => {
    return {
      accessLevel: null,
      cityRoles: [],
      status: ["Disabled", "Active"],
    };
  },
  methods: {
    async getAdminLevel(): Promise<void> {
      try{
        const access = await this.$http.get("/member/getadminlevel");
        this.accessLevel = access.data.accessLevel;
        this.accessCheck();
      } catch (e) {
        console.log(e);
      }
    },
    accessCheck() {
      if (!this.accessLevel.includes('admin')){
        this.$router.push({name: "restrictedaccess"});
      }
    },
    async getRoleList() {
      this.cityRoles = [];
      const roles = await this.$http.get('/admin/rolelist');
      this.cityRoles = roles.data.roles;
    },
  },
  created() {
    this.getAdminLevel();
  },
  mounted() {
    this.getRoleList();
  },
});
</script>
