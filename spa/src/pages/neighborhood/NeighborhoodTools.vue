<template>
	<div class="text-center" v-if="loaded">
		<span href="" class="btn-ui">Information</span>
		<span href="" class="btn-ui">Inbox</span>
		<a
			:href="'#/messageboard/' + this.$store.data.place.hood.id"
			target="_blank"
			class="btn-ui"
			>Messages</a
		>
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
			<!--<router-link :to="
        '/neighborhood/' +
        this.$store.data.place.hood.id +
        '/access_rights'" class="btn-ui">Access Rights</router-link>-->
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
        await this.$http.get(
          `/hood/${  this.$store.data.place.hood.id  }/can_admin`,
        );
        this.canAdmin = true;
      } catch (e) {
        console.log(e);
      }
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

