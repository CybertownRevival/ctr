<template>
  <div v-if="loaded">
    <div class="w-full flex-1 text-center">
      <div class="inline-block mx-auto">
        <div class="h-full w-full bg-gray-600 flex flex-col p-2 text-center" v-if="!access">
          <span style="color: red">Insufficient Access Rights.</span>
        </div>
        <div v-else align="center">
          <p style="font-weight:bold">
            Update <font color="#FFFF00">Owner Access</font> for
            <font color="#FFFF00">{{this.$store.data.place.name}}</font>
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
            <font color="#FFFF00">
              Please be sure, you ALWAYS define the owner
              nickname:</font>
          </strong>
          <table border="0">
            <tr>
              <td><b>Owner</b>:</td>
              <td>
                <input class="input-text" SIZE="16" v-model="owner" />
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
            <strong><font color="#FFFF00">owner access</font></strong>
          </p>
              <div class="flex gap-1 pb-1 justify-center">
                <div class="flex-none">
                  <input class="input-text" size="16" v-model="deputy1" />
                </div>
                <div class="flex-none">
                  <input class="input-text" size="16" v-model="deputy2" />
                </div>
                <div class="flex-none">
                  <input class="input-text" size="16" v-model="deputy3" />
                </div>
                <div class="flex-none">
                  <input class="input-text" size="16" v-model="deputy4" />
                </div>
              </div>
              <div class="flex gap-1 justify-center">
                <div>
                  <input class="input-text" size="16" v-model="deputy5" />
                </div>
                <div>
                  <input class="input-text" size="16" v-model="deputy6" />
                </div>
                <div>
                  <input class="input-text" size="16" v-model="deputy7" />
                </div>
                <div>
                  <input class="input-text" size="16" v-model="deputy8" />
                </div>
              </div>
          <small>
            <i>
              <u>Note:</u> If a nickname does not exist, it is
              ignored without notification.
            </i>
          </small>
          <br />
          <div>
            <span v-show="!error || !success">&nbsp;</span>
            <span v-show="success" style="color: #00df00">Access Rights Update</span>
            <span v-show="error" class="text-red-600">{{ error }}</span>
          </div>
          <button type="button" value="Update" class="btn" @click="updateAccess()">Update</button>
          <button type="button" class="btn" @click="$router.back()">Cancel</button>
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
      data: [],
      loaded: false,
      access: false,
      owner: null,
      deputy1: null,
      deputy2: null,
      deputy3: null,
      deputy4: null,
      deputy5: null,
      deputy6: null,
      deputy7: null,
      deputy8: null,
      success: false,
      error: null,
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
      case "colony":
        endpoint =
            `/colony/${
              this.$store.data.place.id
            }/can_manage_access`;
        break;
      case "public":
        endpoint =
          `/place/can_manage_access/${this.$store.data.place.slug}/${this.$store.data.place.id}`;
        break;
      case "shop": {
        const mallId = await this.$http.get("api/place/mall");
        endpoint = `/place/can_manage_access/mall/${mallId.data.id}`;
        break;
      }
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
      case "colony":
        infopoint = `/colony/${
          this.$store.data.place.id
        }/getAccessInfo/`;
        break;
      case "public":
        infopoint =
            `/place/getAccessInfo/${this.$store.data.place.slug}/${this.$store.data.place.id}`;
        break;
      case "shop": {
        infopoint = "/place/getAccessInfo/mall";
        break;
      }
      default:
        break;
      }
      this.$http.get(infopoint).then((response) => {
        if (response.data.data.owner.length !== 0) {
          this.owner = response.data.data.owner[0].username;
        } else {
          this.owner = "";
        }
        const deputylength = response.data.data.deputies.length;
        if (deputylength > 0) {
          if (deputylength >= 1) {
            this.deputy1 = response.data.data.deputies[0].username;
          } else {
            this.deputy1 = null;
          }
          if (deputylength >= 2) {
            this.deputy2 = response.data.data.deputies[1].username;
          } else {
            this.deputy2 = null;
          }
          if (deputylength >= 3) {
            this.deputy3 = response.data.data.deputies[2].username;
          } else {
            this.deputy3 = null;
          }
          if (deputylength >= 4) {
            this.deputy4 = response.data.data.deputies[3].username;
          } else {
            this.deputy4 = null;
          }
          if (deputylength >= 5) {
            this.deputy5 = response.data.data.deputies[4].username;
          } else {
            this.deputy5 = null;
          }
          if (deputylength >= 6) {
            this.deputy6 = response.data.data.deputies[5].username;
          } else {
            this.deputy6 = null;
          }
          if (deputylength >= 7) {
            this.deputy7 = response.data.data.deputies[6].username;
          } else {
            this.deputy7 = null;
          }
          if (deputylength >= 8) {
            this.deputy8 = response.data.data.deputies[7].username;
          } else {
            this.deputy8 = null;
          }
        } else {
          this.deputy1 = null;
          this.deputy2 = null;
          this.deputy3 = null;
          this.deputy4 = null;
          this.deputy5 = null;
          this.deputy6 = null;
          this.deputy7 = null;
          this.deputy8 = null;
        }
      });
      this.loaded = true;
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
      case "colony":
        updatepoint = `/colony/${
          this.$store.data.place.id
        }/postAccessInfo/`;
        break;
      case "public":
        updatepoint =
          `/place/postAccessInfo/${this.$store.data.place.slug}/${this.$store.data.place.id}`;
        break;
      case "shop": {
        updatepoint = "/place/postAccessInfo/mall";
        break;
      }
      default:
        break;
      }
      try {
        const deputies = [
          {username: this.deputy1},
          {username: this.deputy2},
          {username: this.deputy3},
          {username: this.deputy4},
          {username: this.deputy5},
          {username: this.deputy6},
          {username: this.deputy7},
          {username: this.deputy8},
        ];
        await this.$http.post(updatepoint, {deputies: deputies, owner: this.owner});
        this.error = null;
        this.success = true;
        this.getData();
      } catch (error) {
        this.access = true;
        this.success = false;
        this.error = error.response.data.error;
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
