<template>
  <div class="flex flex-col items-center w-full" v-if="loaded">
    <div class="w-full text-center p-4" v-if="access === false">
      Only club owners can update club information.
    </div>
    <div class="grid justify-items-center w-full" v-else>
      <h1 class="mb-5">Update Club Information</h1>
      <table class="my-5">
        <tr>
          <td class="text-right p-2">Name: </td>
          <td class="w-96 p-2">{{ place.name }}</td>
        </tr>
        <tr>
          <td class="text-right p-2">Description: </td>
          <td class="w-96 p-2"><textarea class="text-black w-full p-1" v-model="place.description" /></td>
        </tr>
        <tr>
          <td class="text-right p-2">Club Access: </td>
          <td class="w-96 p-2">
            <select class="text-black w-full" v-model="place.private">
              <option value=1>By Invitation</option>
              <option value=0>Open For Everyone</option>
            </select>
          </td>
        </tr>
      </table>
      <div class="grid justify-center">
        <span class="w-screen text-center text-red-500" v-if="error">{{ error }}</span>
        <span class="w-screen text-center text-green-500" v-if="success">{{ success }}</span>
      </div>
      <div class="flex justify-center w-full">
        <button class="btn m-2" @click="updatePlace">Update Club</button>
        <button class="btn m-2" @click="$router.push(`/club/${$store.data.place.id}`)">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  name: "ClubUpdate",
  data: () => {
    return {
      place: {} as any,
      updateInfo: {} as any,
      error: "",
      success: "",
      loaded: false,
      access: false,
    };
  },
  methods: {
    async canAccess(): Promise<void> {
      try{
        this.access = (await this.$http.get(`/club/can_manage_access/${this.$store.data.place.id}`)).data.isOwner;
      } catch (e) {
        console.log(e);
        this.$router.push({name: "restrictedaccess"});
      }
    },
    async placeDetails() {
      try {
        await this.$http.get(`/place/by_id/${this.$store.data.place.id}`).then((response) => {
          this.place = response.data.place;
        });
      } catch (e) {
        console.log(e);
        this.error = "Error loading place information."
      }
    },
    async updatePlace() {
      this.error = "";
      this.success = "";
      if (!this.place.description || this.place.description.length < 5) {
        this.error = "Description must be at least 5 characters long.";
        return;
      }
      if (this.place.private !== 1 && this.place.private !== 0) {
        this.error = "Invalid value for Club Access";
        return;
      }
      this.updateInfo = {
        id: this.place.id,
        description: this.place.description,
        private: this.place.private,
      };
      try {
        await this.$http.post(`/club/update`, this.updateInfo);
        this.success = "Club updated successfully.";
      } catch (e) {
        this.error = "Error updating club.";
      }
    },
  },
  created() {
    this.canAccess();
  },
  mounted() {
    this.placeDetails();
    this.loaded = true;
  }
})
</script>