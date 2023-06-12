<template>
	<div v-if="loaded">
		<div class="w-full flex-1 text-center">
			<div class="inline-block mx-auto">
				<div v-if="!access">
					<span style="color:red"> Insufficient access rights.</span>
				</div>
				<div v-else align="center">
					<p style="font-weight:bold">
						Update <font color="#FFFF00">Owner Access</font> for
						<font color="#FFFF00">{{
							this.$store.data.place.name
						}}</font>
					</p>
					<br />

					<h3>
						<strong>
							Here you define citizens, who have full access to
							everything at this place, e.g. read the inbox,
							update the place, change access rights and delete
							things.
						</strong>
					</h3>
					<br />

					<strong>
						<font color="#FFFF00"
							>Please be sure, you ALWAYS define the owner
							nickname:</font
						>
					</strong>

					<table border="0">
						<tr>
							<td><b>Owner</b>:</td>
							<td>
								<input class="input-text" SIZE="16" />
							</td>
						</tr>
					</table>

					<br />

					<p>
						If you want to add citizens to have owner access you can
						explicitly define them by nickname and/or by job.
					</p>
					<br />

					<p>
						You can define
						<strong>
							<font color="#FFFF00">
								up to 8 citizens
							</font>
						</strong>
						having
						<strong
							><font color="#FFFF00">owner access</font></strong
						>
					</p>

					<table border="0">
						<tr>
							<td>
								<input SIZE="16" class="input-text" />
							</td>
							<td>
								<input SIZE="16" class="input-text" />
							</td>
							<td>
								<input SIZE="16" class="input-text" />
							</td>
							<td>
								<input SIZE="16" class="input-text" />
							</td>
						</tr>

						<tr>
							<td>
								<input SIZE="16" class="input-text" />
							</td>
							<td>
								<input SIZE="16" class="input-text" />
							</td>
							<td>
								<input SIZE="16" class="input-text" />
							</td>
							<td>
								<input SIZE="16" class="input-text" />
							</td>
						</tr>
					</table>

					<small
						><i
							><u>Note:</u> If a nickname does not exist, it is
							ignored without notification.</i
						></small
					>
					<br />
					<br />
					<button type="button" value="Update" class="btn">
						Update
					</button>
					<button type="button" class="btn" @click="$router.back()">
						Cancel
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue from "vue";

	export default Vue.extend({
		name: "AccessRightsPage",
		data: () => {
			return {
				loaded: false,
				access: false,
				owner: null,
				deputies: []
			};
		},
		methods: {
			async hasAccess(): Promise<boolean> {
				let endpoint = null;

				switch (this.$store.data.place.type) {
					case "block":
						endpoint =
							"/block/" +
							this.$store.data.place.id +
							"/can_manage_access";
						break;
					case "hood":
						break;
					default:
						break;
				}

				try {
					await this.$http.get(endpoint);
					return true;
				} catch (e) {
					return false;
				}
			},
			async getData(): Promise<void> {
				// todo: get leader and deputies
				this.loaded = true;
			},
			async update(): Promise<void> {
				// todo: update
			}
		},
		async mounted(): Promise<void> {
			if (
				typeof this.$store.data.place.id === "undefined" ||
				typeof this.$store.data.place.type === "undefined"
			) {
				console.error("Place is not set.");
				return;
			}

			try {
				if (!this.hasAccess()) {
					return;
				}
				this.access = true;

				this.getData();
			} catch (e) {
				console.error(e);
			}
		}
	});
</script>
