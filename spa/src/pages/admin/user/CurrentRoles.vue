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
          <td class="px-4 py-2 font-bold">Role</td>
          <td class="px-4 py-2 font-bold">Place</td>
        </tr>
        <tr v-for="id in roles" :key="id">
          <td class="border text-white px-4 py-2">{{ id.name }}</td>
          <td class="border text-white px-4 py-2">{{ id.place }}</td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
  export default {
    name: "UserCurrentRoles",
    data() {
      return {
        roles: [],
        error: "",
      }
    },
    props: ["accessLevel"],
    methods: {
      async getRoles() {
        this.error = "";
        try {
          await this.$http.get("/member/roles", {id: this.$route.params.id})
              .then(response => {
                this.roles = response.data.roles;
              })
        } catch (e) {
          this.error = e;
        }
      }
    },
    async created() {
      if (!this.accessLevel.includes('security')) {
        this.$router.push({ name: "restrictedaccess" });
      }
      await this.getRoles();
    },
  }
</script>
