<template>
  <div v-if="!canAdmin" class="w-full flex h-full justify-center">
    <div class="text-red-500">{{ error }}</div>
  </div>
  <!--
    No navigation of its own. The staff tools render inside the site's normal
    content region, and their navigation lives in the right-hand control panel
    alongside every other Cybertown control (see StaffTools.vue), so this is
    only the content frame.
  -->
  <div v-else class="w-full h-full p-1 overflow-y-auto"><router-view /></div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "MallStaffPage",
  data: () => {
    return {
      canAdmin: false,
      showError: false,
      error: "",
      success: "",
      showSuccess: false,
      loaded: false,
    };
  },
  async mounted(): Promise<void> {
    this.loaded = true;
    this.isMallStaff();
  },
  methods: {
    async isMallStaff() {
      try {
        await this.$http.get("/mall/can_admin");
        this.canAdmin = true;
      } catch (e) {
        this.error = "Access Denied!";
      }
    },
  },
});
</script>
