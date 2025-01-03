<template>
<div>
  <div class="mb-3">
    The current donor status is: {{ status }}
  </div>
  <select class="mr-3" v-model="donorLevel">
    <option value="first" disabled>---Select Donor Level---</option>
    <option value="">None</option>
    <option v-for="level in levels" :key="level" :value="level">
      {{ level }}
    </option>
  </select>
  <button class="btn" @click="setDonor">Set Donor Level</button>
</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "UserDonor",
  data() {
    return {
      donorLevel: "first",
      levels: [
        "Supporter",
        "Advocate",
        "Devotee",
        "Champion",
      ],
      status: "None",
    };
  },
  props: ["accessLevel"],
  methods: {
    async setDonor(): Promise<void> {
      await this.$http.post("/admin/donor", {
        member_id: this.$route.params.id,
        level: this.donorLevel,
      })
        .then(() => {
          this.donorLevel = "first";
          this.getDonor();
        });
    },
    async getDonor(): Promise<void> {
      try {
        await this.$http.get("/admin/donor", {
          memberId: this.$route.params.id,
        })
          .then((response) => {
            console.log(response.data.donorLevel.name);
            if (response.data.donorLevel.name) {
              this.status = response.data.donorLevel.name;
            } else {
              this.status = "None";
            }
          });
      } catch (e) {
        this.status = "None";
      }
    },
  },
  mounted() {
    if (!this.accessLevel.includes('admin')) {
      this.$router.push({ name: "restrictedaccess" });
    }
    this.getDonor();
  },
});
</script>
