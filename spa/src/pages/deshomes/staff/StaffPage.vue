<template>
  <div v-if="!canAdmin" class="w-full flex h-full justify-center">
    <div class="text-red-500">{{ error }}</div>
  </div>
  <div v-else class="w-full flex">
    <div class="flex-col w-56 border-r-2 border-white text-center">
      <br />
      <div class="mb-2">
        <router-link class="btn-ui" :to="{name: 'DesignerHomesPending'}">Pending</router-link>
      </div>
      <div class="mb-2">
        <router-link class="btn-ui" :to="{name: 'DesignerHomesStocked'}">Stocked</router-link>
      </div>
      <div class="mb-2">
        <router-link class="btn-ui" :to="{name: 'DesignerHomesSettings'}">Settings</router-link>
      </div>
      <br />
      <div class="mb-2">
        <router-link class="btn-ui" :to="{path: '/place/deshomes'}">
          Return to Designer Homes
        </router-link>
      </div>
    </div>
    <div class="w-11/12 h-full p-1 overflow-y-auto"><router-view /></div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "DesignerHomesStaffPage",
  data: () => {
    return {
      canAdmin: false,
      error: "",
    };
  },
  async mounted(): Promise<void> {
    try {
      await this.$http.get("/designer_home/can_admin");
      this.canAdmin = true;
    } catch (e) {
      this.error = "Access Denied!";
    }
  },
});
</script>
