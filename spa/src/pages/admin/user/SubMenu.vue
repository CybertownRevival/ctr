<template>
  <div class="grid grid-cols-1 w-full place-content-center">
    <div
      class="flex w-full min-w-min justify-center my-2"
      v-if="isUserDetailRoute"
    >
      <div class="flex">
        <router-link
          class="btn-ui-inline mx-1 w-20"
          v-if="this.$route.name !== 'UserView'"
          :to="{name: 'UserView'}"
        >VIEW</router-link>
        <button
          class="btn-ui-inline mx-1 w-20"
          v-else
        >VIEW</button>
        <div v-if="accessLevel.includes('security')">
          <router-link
            class="btn-ui-inline mx-1 w-32"
            :to="{name: 'TransactionHistory'}"
          >Transactions</router-link>
          <router-link
            class="btn-ui-inline mx-1 w-20"
            :to="{name: 'UserStorageAreas'}"
          >Storage</router-link>
          <router-link
            class="btn-ui-inline mx-1 w-20"
            :to="{name: 'UserClubs'}"
          >Clubs</router-link>
        </div>
        <div v-if="accessLevel.includes('admin')">
          <router-link
            class="btn-ui-inline mx-1 w-20"
            :to="{name: 'OwnedObjects'}"
          >Objects</router-link>
          <router-link
            class="btn-ui-inline mx-1 w-20"
            :to="{name: 'UserMallUploads'}"
          >Uploads</router-link>
        </div>
      </div>
    </div>

    <div
      class="w-full min-w-min text-center my-2"
      v-else-if="isUserBanRoute"
    >
      <router-link
        class="btn-ui-inline mx-1 w-20"
        :to="{name: 'UserBanAdd'}"
        v-if="accessLevel.includes('security')"
      >ADD</router-link>
      <router-link
        class="btn-ui-inline mx-1 w-20"
        :to="{name: 'UserBanHistory'}"
      >HISTORY</router-link>
    </div>

    <div
      class="w-full min-w-min text-center my-2"
      v-else-if="
        isUserRoleRoute &&
        (accessLevel.includes('leader') ||
          accessLevel.includes('security'))
      "
    >
      <router-link
        class="btn-ui-inline mx-1 w-24"
        :to="{name: 'UserCurrentRoles'}"
      >CURRENT</router-link>

      <router-link
        v-if="accessLevel.includes('admin') || canManageSecurityRoles"
        class="btn-ui-inline mx-1 w-24"
        :to="{name: 'UserHireRoles'}"
      >HIRE</router-link>

      <router-link
        v-if="accessLevel.includes('admin') || canManageSecurityRoles"
        class="btn-ui-inline mx-1 w-24"
        :to="{name: 'UserFireRoles'}"
      >TERMINATE</router-link>
    </div>

    <div
      class="w-full min-w-min text-center my-2"
      v-else
    />

    <div class="flex w-full min-w-min items-center justify-center">
      <router-view
        :accessLevel="accessLevel"
        :canManageSecurityRoles="canManageSecurityRoles"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "UserSubMenu",

  props: ["accessLevel"],

  data() {
    return {
      canManageSecurityRoles: false,
    };
  },

  computed: {
    isUserDetailRoute(): boolean {
      const memberView = [
        "UserView",
        "UserEdit",
        "TransactionHistory",
        "OwnedObjects",
        "UserStorageAreas",
        "UserClubs",
        "UserMallUploads",
      ];

      return memberView.includes(this.$route.name);
    },

    isUserBanRoute(): boolean {
      return this.$route.name === "UserBanHistory" ||
        this.$route.name === "UserBanAdd";
    },

    isUserRoleRoute(): boolean {
      return this.$route.name === "UserHireRoles" ||
        this.$route.name === "UserCurrentRoles" ||
        this.$route.name === "UserFireRoles";
    },
  },

  methods: {
    async getSecurityRolePermission(): Promise<void> {
      try {
        const response =
          await this.$http.get("/member/can-manage-security-roles");

        this.canManageSecurityRoles = response.data.canManage;
      } catch (error) {
        console.log(error);
        this.canManageSecurityRoles = false;
      }
    },
  },

  async created() {
    await this.getSecurityRolePermission();
  },
});
</script>
