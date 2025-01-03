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
			<router-link
				:to="'/block/' + this.$store.data.place.block.id + '/wizard'"
				class="btn-ui"
			>
				Update
			</router-link>
			<span class="btn-ui" title="Check Images">Check</span>
			<router-link
				:to="{ name: 'blockaccessrights' }"
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
      canAdmin: false,
      loaded: false,
    };
  },
  methods: {
    async checkAdmin() {
      try {
        const adminCheck = await this.$http.get(
          `/block/${  this.$store.data.place.block.id  }/can_admin`,
        );
        this.canAdmin = adminCheck;
      } catch (e) {
        console.log(e);
      }
    },
    async opener(link) {
      window.open(link, "targetWindow", "height=650,width=800,menubar=no,status=no");
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

