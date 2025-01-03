<template>
	<div class="text-center" v-if="loaded">
	<button class="btn-ui"
            v-on:click="opener('#/information/'
     +$store.data.place.type
     +'/'
     +$store.data.place.id)">Information</button>
	<button class="btn-ui"
     v-on:click="opener('#/inbox/'+$store.data.place.id)">Inbox</button>
    <button class="btn-ui"
            v-on:click="opener('#/messageboard/'+$store.data.place.id)">Messages</button>
    
		<span href="" class="btn-ui">Vote</span>
		<router-link
			v-if="this.$store.data.place.colony"
			:to="'/place/' + this.$store.data.place.colony.slug"
		>
			<img src="/assets/img/up.gif" />
			{{ this.$store.data.place.colony.name }}
		</router-link>
		<br />
		<br />
		<div v-if="canAdmin && this.$store.data.place.hood">
			<span href="" class="btn-ui">Message to All</span>
			<span href="" class="btn-ui">Inbox to All</span>
			<span href="" class="btn-ui">Update</span>
      <router-link :to="{ name: 'neighborhoodAccessRights' }" class="btn-ui">Access Rights</router-link>
		</div>
		<br />
	</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "NeighborhoodTools",
  data: () => {
    return {
      canAdmin: false,
      loaded: false,
    };
  },
  methods: {
    async checkAdmin() {
      try {
        this.canAdmin = await this.$http.get(
          `/hood/${  this.$store.data.place.hood.id  }/can_admin`,
        );
      } catch (e) {
        this.canAdmin = false;
      }
    },
    async opener(link) {
      window.open(link, "targetWindow", "height=650,width=800,menubar=no,status=no");
    },
  },
  watch: {
    "$store.data.place.hood": {
      handler() {
        if (this.$store.data.place.hood) {
          this.loaded = true;
          this.checkAdmin();
        }
      },
    },
  },
});
</script>

