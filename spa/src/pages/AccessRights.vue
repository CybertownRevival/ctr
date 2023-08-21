<template>
	<div v-if="loaded">
		<div class="w-full flex-1 text-center">
			<div class="inline-block mx-auto">
				<div v-if="!access">
					<span style="color:red"> Insufficient access rights.</span>
				</div>
				<div v-else align="center">
          <div v-if="success">
            <span style="color: #00df00">Access Rights Update</span>
          </div>
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
								<input class="input-text" SIZE="16" v-if="!owner" />
								<input class="input-text" SIZE="16" v-model="owner" v-else />
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
								<input SIZE="16" class="input-text" v-model="deputies[0].username" />
							</td>
							<td>
								<input SIZE="16" class="input-text" v-model="deputies[1].username" />
							</td>
							<td>
								<input SIZE="16" class="input-text" v-model="deputies[2].username" />
							</td>
							<td>
								<input SIZE="16" class="input-text" v-model="deputies[3].username" />
							</td>
						</tr>

						<tr>
							<td>
								<input SIZE="16" class="input-text" v-model="deputies[4].username" />
							</td>
							<td>
								<input SIZE="16" class="input-text" v-model="deputies[5].username" />
							</td>
							<td>
								<input SIZE="16" class="input-text" v-model="deputies[6].username" />
							</td>
							<td>
								<input SIZE="16" class="input-text" v-model="deputies[7].username" />
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
					<button type="button" value="Update" class="btn" @click="updateAccess()">
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
import {response} from "express";

export default Vue.extend({
  name: "AccessRightsPage",
  data: () => {
    return {
      data: [],
      loaded: false,
      access: false,
      owner: null,
      deputies: [
        {username: null},
        {username: null},
        {username: null},
        {username: null},
        {username: null},
        {username: null},
        {username: null},
        {username: null}],
      success: false,
    };
  },
  methods: {
    async hasAccess(): Promise<boolean> {
      let endpoint = null;
      switch (this.$store.data.place.type) {
      case "block":
        endpoint =
            `/block/${
              this.$store.data.place.id
            }/can_manage_access`;
        break;
      case "hood":
        endpoint =
            `/hood/${
              this.$store.data.place.id
            }/can_manage_access`;
        break;
      default:
        break;
      }

      try {
        await this.$http.get(endpoint);
      } catch (error) {
        this.access = false;
        this.loaded = true;
        return;
      }
    },
    async getData(): Promise<void> {
      let infopoint = null;
      console.log(this.$store.data.place.type);
      switch (this.$store.data.place.type) {
      case "block":
        infopoint = `/block/${
          this.$store.data.place.id
        }/getAccessInfo/`;
        break;
      case "hood":
        infopoint = `/hood/${
          this.$store.data.place.id
        }/getAccessInfo/`;
        break;
      default:
        break;
      }
      this.loaded = true;
      return this.$http.get(infopoint).then((response) => {
        this.owner = response.data.data.owner[0].username;
        response.data.data.deputies.forEach((username, index) => {
          this.deputies[index] = username;
        });
      });
    },
    async updateAccess(): Promise<void> {
      let updatepoint = null;
      switch (this.$store.data.place.type) {
      case "block":
        updatepoint = `/block/${
          this.$store.data.place.id
        }/postAccessInfo/`;
        break;
      case "hood":
        updatepoint = `/hood/${
          this.$store.data.place.id
        }/postAccessInfo/`;
        break;
      default:
        break;
      }
      try {
        await this.$http.post(updatepoint, {deputies: this.deputies, owner: this.owner});
        this.success = true;
      } catch (error) {
        this.access = false;
      }
    },
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
    } catch (e) {
      console.error(e);
    }
    this.getData();
  },
});
</script>
