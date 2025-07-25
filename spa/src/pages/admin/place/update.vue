<template>
  <div class="flex flex-col w-screen items-center">
    <h1 class="mb-5">Admin Update Place</h1>
    <div>Original Name: {{ oldName }}</div>
    <div class="grid justify-items-center">
      <table class="my-5">
        <tr>
          <td class="text-right p-2">Place ID: </td>
          <td class="p-2">{{ place.id }}</td>
        </tr>
        <tr>
          <td class="text-right p-2">Name: </td>
          <td class="w-96 p-2"><input class="text-black w-full" v-model="place.name" type="text" /></td>
        </tr>
        <tr v-if="isTypeIncluded(['public', 'shop', 'colony', 'home', 'club', 'private'])">
          <td class="text-right p-2">Description: </td>
          <td class="w-96 p-2"><input class="text-black w-full" v-model="place.description" type="text" /></td>
        </tr>
        <tr v-if="isTypeIncluded(['public', 'shop', 'colony', 'private'])">
          <td class="text-right p-2">Slug: </td>
          <td class="w-96 p-2"><input class="text-black w-full" v-model="place.slug" type="text" /></td>
        </tr>
        <tr v-if="isTypeIncluded(['shop', 'home', 'private'])">
          <td class="text-right p-2">Assets Directory: </td>
          <td class="w-96 p-2"><input class="text-black w-full" v-model="place.assets_dir" type="text" /></td>
        </tr>
        <tr v-if="isTypeIncluded(['shop', 'home','private'])">
          <td class="text-right p-2">World Filename: </td>
          <td class="w-96 p-2"><input class="text-black w-full" v-model="place.world_filename" type="text" /></td>
        </tr>
        <tr>
          <td class="text-right p-2">Status: </td>
          <td class="w-96 p-2">
            <select class="text-black w-full" v-model="place.status">
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </td>
        </tr>
      </table>
      <div class="grid justify-center">
        <span class="w-screen text-center text-red-500" v-if="error">{{ error }}</span>
        <span class="w-screen text-center text-green-500" v-if="success">{{ success }}</span>
      </div>
      <button class="btn-ui" @click="updatePlace">Update Place</button>
  </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  name: "AdminPlaceUpdate",
  data: () => {
    return {
      accessLevel: "none",
      oldName: "",
      place: {} as any,
      error: "",
      success: "",
    };
  },
  methods: {
    async getAdminLevel(): Promise<void> {
      try{
        await this.$http.get("/member/getadminlevel")
          .then((response) => {
            this.accessLevel = response.data.accessLevel;
            if (this.accessLevel === "none"){
              this.$router.push({name: "restrictedaccess"});
            }
          });
      } catch (e) {
        console.log(e);
        this.$router.push({name: "restrictedaccess"});
      }
    },
    async placeDetails() {
      try {
        await this.$http.get(`/place/by_id/${this.$route.params.id}`).then((response) => {
          this.place = response.data.place;
          this.oldName = response.data.place.name;
        });
      } catch (e) {
        console.log(e);
        this.error = "Error loading place information."
      }
    },
    isTypeIncluded(types: string[]): boolean {
      return types.includes(this.place.type);
    }
    async updatePlace() {
      this.error = "";
      this.success = "";
      try {
        await this.$http.post(`/admin/places/update`, this.place);
        this.success = "Place updated successfully.";
      } catch (e) {
        this.error = "Error updating place.";
      }
    },
  },
  created() {
    this.getAdminLevel();
  },
  mounted() {
    this.placeDetails();
  }
})
</script>
