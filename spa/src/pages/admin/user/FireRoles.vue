<template>
  <div>
    <div v-if="error">
      <div class="text-red-600">
        {{ error }}
      </div>
    </div>

    <div v-if="!error && roles.length > 0">
      <table>
        <tbody>
          <tr>
            <td class="px-4 py-2 font-bold text-center">Role</td>
            <td class="px-4 py-2 font-bold text-center">Place</td>
            <td />
          </tr>

          <tr
            class="hover:bg-gray-600"
            v-for="id in roles"
            :key="id"
          >
            <td class="border text-white px-4 py-2">
              {{ id.name }}
            </td>

            <td class="border text-white px-4 py-2">
              <span v-if="id.place === null">City Wide</span>
              <span v-else>{{ id.place }}</span>
            </td>

            <td class="border text-red-500 px-4 py-2">
              <button
                v-if="canFireRole(id.name)"
                class="border text-white px-4 py-2 bg-red-900"
                @click="
                  showFireModal = true;
                  fireId = id.id;
                  firePlace = id.place_id;
                  fireRoleName = id.name;
                "
              >
                Fire
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showFireModal">
      <div class="fixed inset-0 z-50 flex justify-center items-center">
        <div
          class="
            flex flex-col w-2/6 max-w-5xl rounded-lg
            shadow-lg bg-red-300 text-red-800
          "
        >
          <div class="p-5">
            <div class="flex justify-between items-start">
              <h3 class="text-2xl font-semibold">
                Terminate User?
              </h3>

              <button
                class="p-1 leading-none"
                @click="showFireModal = false"
              >
                <div class="text-xl font-semibold h-6 w-6">
                  <span>x</span>
                </div>
              </button>
            </div>
          </div>

          <div class="p-6">
            <p>
              Are you sure you want to terminate this user?
            </p>
          </div>

          <div class="p-6 flex justify-end items-center">
            <button
              class="btn pr-1"
              @click="showFireModal = false"
            >
              Cancel
            </button>

            <button
              class="btn"
              @click="fireUser"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>

      <div class="opacity-50 fixed inset-0 z-60 bg-black"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: "UserFireRoles",

  data() {
    return {
      error: "",
      fireId: null,
      firePlace: null,
      fireRoleName: null,
      loaded: false,
      roles: [],
      showFireModal: false,
      canManageSecurityRoles: false,
    };
  },

  props: ["accessLevel"],

  methods: {
    async getSecurityRolePermission() {
      try {
        const response =
          await this.$http.get("/member/can-manage-security-roles");

        this.canManageSecurityRoles = response.data.canManage;
      } catch (error) {
        this.canManageSecurityRoles = false;
      }
    },

    canFireRole(roleName) {
      if (this.accessLevel.includes("admin")) {
        return true;
      }

      if (!this.canManageSecurityRoles) {
        return false;
      }

      const securityRoles = [
        "Security Captain",
        "Security Lieutenant",
        "Security Sergeant",
        "Security Officer",
        "Security Advisor",
        "Jail Guard",
      ];

      return securityRoles.includes(roleName);
    },

    async fireUser() {
      this.showFireModal = false;

      try {
        await this.$http.post("/admin/firerole", {
          member_id: this.$route.params.id,
          role_id: this.fireId,
          place_id: this.firePlace,
        });

        await this.getRoles();
      } catch (error) {
        this.error =
          "There was an error while terminating role";
      }
    },

    async getRoles() {
      this.error = "";

      try {
        const response =
          await this.$http.get(
            `/member/roles/${this.$route.params.id}`,
          );

        this.roles = response.data.roles;
      } catch (error) {
        this.error = error;
      }
    },
  },

  async mounted() {
    await this.getSecurityRolePermission();

    if (
      !this.accessLevel.includes("admin") &&
      !this.canManageSecurityRoles
    ) {
      this.$router.push({ name: "restrictedaccess" });
      return;
    }

    await this.getRoles();
  },
};
</script>
