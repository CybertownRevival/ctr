<template>
<div>
  <div style="font-size: small" v-if="checking">Checking for Bans...</div>
</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "BanCheck",
  data: () => {
    return {
      checking: true,
    };
  },
  methods: {
    async isBanned(): Promise<any> {
      return this.$http.post("/member/is_banned")
        .then((response) => {
          if (response.data.data === 0) {
            this.$store.methods.destroySession();
            this.$router.push({name: "login"});
          }
          this.checking = false;
        });
    },
  },
  mounted() {
    this.isBanned();
  }
});
</script>
