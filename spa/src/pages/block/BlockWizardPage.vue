<template>
	<div v-if="loaded">
		<div class="w-full flex-1 text-center">
			<div class="inline-block mx-auto">
				<div
					:style="{
						width: '480px',
						height: '240px',
						'background-image': mapBackground
					}"
					class="grid grid-cols-12 gap-0"
				>
					<div
						v-for="index in 72"
						:key="index"
						style="height:40px;line-height:40px;"
					>
						<template
							v-if="locations.find(b => b.location === index)"
						>
							<router-link
								:to="
									'/block/' +
										locations.find(
											b => b.location === index
										).id
								"
								class="w-full h-full block text-center flex items-center justify-center"
								v-if="
									locations.find(b => b.location === index).id
								"
							>
								<span style="padding: 3px; max-height: 40px; line-height: 13px; overflow: hidden;">{{
									locations.find(b => b.location === index)
										.name
								}}</span>
							</router-link>
							<input
								type="checkbox"
								v-model="availableLocations"
								v-else
								:value="index"
							/>
						</template>
						<template v-else>
							<input
								type="checkbox"
								v-model="availableLocations"
								:value="index"
							/>
						</template>
					</div>
				</div>
			</div>

			<p>
				<strong
					>Update Wizard for block '{{
						this.$store.data.place.block.name
					}}'</strong
				>
			</p>

			<small
				>Checkmark the plots where you want members to settle
				down.</small
			>
			<br />
			<button type="button" @click="update" class="btn">Update</button>
			<br />

			<small>
				Change the
				<a href="block<$g_exe>?ac=wizardimage&ID=<$ID>" target="place"
					>background image</a
				>
				for this <strong>block</strong>.
			</small>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue from "vue";
	import { colonyDataHelper } from "@/helpers";

	export default Vue.extend({
		name: "BlockWizardPage",
		props: ["block", "hood", "colony"],
		data: () => {
			return {
				loaded: false,
				locations: [],
				availableLocations: []
			};
		},
		methods: {
			async getData(): Promise<void> {
				this.$http
					.get("/block/" + this.$route.params.id + "/locations")
					.then(response => {
						this.locations = response.data.locations;
						this.availableLocations = this.locations
							.filter(location => {
								return location.available;
							})
							.map(loc => {
								return loc.location;
							});

						document.title = this.block.name + " Wizard - Cybertown";
						this.loaded = true;
					});
			},
			update(): void {
				this.$http
					.post("/block/" + this.$route.params.id + "/locations", {
						availableLocations: this.availableLocations
					})
					.then(() => {
						alert("Block Updated");
					});
			},
			async checkAdmin(): Promise<boolean> {
				try {
					const adminCheck = await this.$http.get(
						"/block/" + this.$store.data.place.block.id + "/can_admin"
					);
					return true;
				} catch (e) {
					return false;
				}
			}
		},
		computed: {
			mapBackground(): string {
				return (
					"url('/assets/img/map_themes/" +
					colonyDataHelper[this.colony.slug].map_theme +
					"/block/Pimg2D000.gif')"
				);
			}
		},
		async mounted(): Promise<void> {
			if (!(await this.checkAdmin())) {
				this.$router.push("/restricted");
			} else {
				this.getData();
			}
		},
		async beforeDestroy() {}
	});
</script>
