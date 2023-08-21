<template>
	<div class="text-center" v-if="loaded">
		<span class="btn-ui">Information</span>
		<a
			:href="'#/messageboard/' + this.$store.data.place.block.id"
			target="_blank"
			class="btn-ui"
			>Messages</a
		>
		<router-link
			v-if="this.$store.data.place.hood"
			:to="'/neighborhood/' + this.$store.data.place.hood.id"
		>
			<img src="/assets/img/up.gif" />
			{{ this.$store.data.place.hood.name }}
		</router-link>
		<br />
		<br />
		<div v-if="canAdmin && this.$store.data.place.block">
			<span class="btn-ui">Message to All</span>
			<span class="btn-ui">Inbox</span>
			<router-link
				:to="'/block/' + this.$store.data.place.block.id + '/wizard'"
				class="btn-ui"
			>
				Update
			</router-link>
			<span class="btn-ui" title="Check Images">Check</span>
			<router-link
				:to="
					'/block/' +
						this.$store.data.place.block.id +
						'/access_rights'
				"
				class="btn-ui"
				>Access Rights</router-link>
		</div>
		<br />
	</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "BlockTools",
  data: () => {
    return {
      adminCheck: false,
      canAdmin: false,
      loaded: false,
    };
  },
  methods: {
    async checkAdmin() {
      try {
        this.adminCheck = await this.$http.get(
          `/block/${  this.$store.data.place.block.id  }/can_admin`,
        );
        this.canAdmin = true;
      } catch (e) {
        console.log(e);
      }
    },
  },
  mounted() {
    this.checkAdmin();
  },
  watch: {
    "$store.data.place.block": {
      handler() {
        if (this.$store.data.place.block) {
          this.loaded = true;
          this.checkAdmin();
        }
      },
    },
  },
});
</script>

