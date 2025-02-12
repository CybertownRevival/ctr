<template>
  <div class="flex justify-center min-w-full">
  <div class="text-center">
    <img src="../../../assets/img/club/create_club.gif" alt="Create Club" height="100" class="mb-2">
    <form @submit.prevent="createClub">
      <table class="table-auto mx-auto">
        <tr class="border-b-8 border-black">
          <td align="right">Club Name:</td>
          <td><input
              type="text"
              v-model="club.name"
              maxlength="16"
              size="16"
              class="text-black"
              required></td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
        </tr>
        <tr>
          <td align="right">Club access:</td>
          <td>
            <select v-model="club.type">
              <option value="public_club">Open for everyone</option>
              <option value="private_club">By Invitation</option>
            </select>
          </td>
        </tr>
      </table>
      <br>
      <textarea
          v-model="club.description"
          rows="7"
          cols="60"
          placeholder="Club Description."
          class="text-black"
          required></textarea><br>
      <br>
      <!-- rules update potentially later
      <textarea v-model="club.rules" rows="4" cols="60"
      placeholder="Enter here the rules for your club."></textarea><br>
      -->
      <br>
      <span class="text-red-500" v-show="error">{{ error }}</span>
      <br>
      <button class="btn py-0.5 mr-2" type="submit">Create</button>
      <button class="btn py-0.5" type="button" @click="cancel">Cancel</button>
    </form>
  </div>
</div>
</template>

<script>
import Vue from "vue";

export default Vue.extend({
  name: "CreateClubPage",
  data: () => {
    return {
      error: null,
      club: {
        name: "",
        type: "private_club",
        //colony: "",
        description: "",
        //rules: "",
        //backgroundColor: "#000000",
        //linkColor: "#00FF00",
        //textColor: "#D0DBF7",
      },
      colors: [
        { name: "Default", value: "#000000", fontColor: "#ffffff" },
        { name: "White", value: "#ffffff", fontColor: "#000000" },
        { name: "Black", value: "#000000", fontColor: "#ffffff" },
        { name: "Charcoal Gray", value: "#808080", fontColor: "#000000" },
        { name: "Sky Blue", value: "#0080ff", fontColor: "#000000" },
        { name: "Lemon Yellow", value: "#ffff00", fontColor: "#000000" },
        { name: "Crimson", value: "#ff0000", fontColor: "#000000" },
        { name: "Royal Blue", value: "#000080", fontColor: "#ffffff" },
        { name: "Vermont Green", value: "#00ff00", fontColor: "#000000" },
        { name: "Sapphire", value: "#00ffff", fontColor: "#000000" },
        { name: "Deep Purple", value: "#800080", fontColor: "#ffffff" },
        { name: "Pink Rose", value: "#ff8080", fontColor: "#000000" },
        { name: "Brown Derby", value: "#800000", fontColor: "#ffffff" },
        { name: "Florida Orange", value: "#ff8000", fontColor: "#000000" },
      ],
    };
  },
  methods: {
    async createClub() {
      try {
        const response = await this.$http.post("/club/create", this.club);
        // redirect to the new club page using the response data id
        this.$router.push(`/club/${response.data.success}`);
        // Handle success (e.g., redirect to another page or show a success message)
      } catch (error) {
        console.log(error);
        this.error = error.response.data.error;
        // Handle error (e.g., show an error message)
      }
    },
    cancel() {
      this.$router.go(-1);
    },
  },
});
</script>
