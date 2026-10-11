<template>
  <div class="p-5">
    <h2 class="text-center">My Designer Homes Uploads</h2>
    <div class="text-red-500 text-center" v-show="error">{{ error }}</div>
    <div v-if="loaded && designerHomes.length === 0" class="text-center my-5">
      You haven't uploaded any homes yet.
    </div>
    <table v-else class="mx-auto my-3">
      <tr>
        <th class="p-2"></th>
        <th class="p-2 text-left">Name</th>
        <th class="p-2 text-left">Store</th>
        <th class="p-2 text-left">Price</th>
        <th class="p-2 text-left">Status</th>
      </tr>
      <tr v-for="designerHome in designerHomes" :key="designerHome.id">
        <td class="p-2">
          <img :src="`/assets/worlds/deshomes/${designerHome.directory}/${designerHome.image}`"
               style="max-width:100px;max-height:100px;" />
        </td>
        <td class="p-2">{{ designerHome.name }}</td>
        <td class="p-2">{{ designerHome.store_name }}</td>
        <td class="p-2">{{ designerHome.price }}cc</td>
        <td class="p-2">{{ statusNames[designerHome.status] }}</td>
      </tr>
    </table>
    <div class="text-center">
      <router-link to="/place/deshomes"><button class="btn">Back</button></router-link>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "DesignerHomesMyUploadsPage",
  data: () => {
    return {
      designerHomes: [],
      loaded: false,
      error: "",
      statusNames: {
        0: "Removed",
        1: "For Sale",
        2: "Pending Approval",
      },
    };
  },
  async mounted(): Promise<void> {
    try {
      const response = await this.$http.get("/designer_home/my_uploads");
      this.designerHomes = response.data.designerHomes;
    } catch (errorResponse: any) {
      this.error = errorResponse.response?.data?.error ?? "An unknown error occurred";
    }
    this.loaded = true;
  },
});
</script>
