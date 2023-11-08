<template>
	<div class="h-full w-full bg-black flex flex-col p-2" v-if="loaded">
		<router-view :block="block" :hood="hood" :colony="colony"></router-view>
	</div>
</template>

<script lang="ts">
	import Vue from "vue";
	import { BlockData } from "./block-data.interface";

	export default Vue.extend({
		name: "BlockPage",
		data: (): BlockData => {
			return {
				loaded: false,
				block: undefined,
				hood: undefined,
				colony: undefined
			};
		},
		methods: {
			getData() {
				this.$http.get("/block/" + this.$route.params.id).then(response => {
					let place = response.data.block;
					place.block = response.data.block;
					place.hood = response.data.hood;
					place.colony = response.data.colony;

					this.block = response.data.block;
					this.hood = response.data.hood;
					this.colony = response.data.colony;
					this.$store.methods.setPlace(place);

					this.loaded = true;
				});
			}
		},
		mounted() {
			this.getData();
		}
	});
</script>
