<template>
  <div v-show="loaded" class="w-full items-center">
    <div class="w-full text-center mb-4">
      <span><h3>Welcome to Club {{ $store.data.place.name }}</h3></span>
    </div>
    <div>
      <div class="flex justify-center w-full mt-5 mb-2">
        <b>Description:</b>
      </div>
      <div class="flex justify-center w-full mt-2 mb-5">
        {{ $store.data.place.description }}
      </div>
      <div class="flex justify-center w-full mt-5">
        <span v-if="showButton" class="w-1/8">
          <img src="../../../assets/img/club/join.gif" alt="Join Club" class="w-full cursor-pointer" @click="join">
        </span>
        <span v-else-if="status === 'pending'" class="text-yellow-300">
          Membership Request is Pending
        </span>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "ClubDoor",
  data: () => {
    return {
      loaded: false,
      showButton: false,
      status: "none",
    };
  },
  methods: {
    async join() {
      await this.$http.post("/club/join", { clubId: this.$route.params.id });
      this.showButton = false;
      this.getMembership();
      return;
    },
    async getMembership(): Promise<void> {
      await this.$http.get("/club/status", { clubId: this.$route.params.id }).then((response) => {
        console.log(response)
        this.status = response.data.status;
        if(this.status === 'none'){
          this.showButton = true;
        }
      });
    },
  },
  created() {
    this.getMembership();
  },
  mounted() {
    this.loaded = true;
  },
});
</script>
