<template>
  <div class="w-full flex">
    <div class="flex flex-col w-full place-items-center">
      <div class="text-red-500" v-show="error">{{ error }}</div>
      <div class="text-green-500" v-show="success">{{ success }}</div>
      <div class="text-center w-full text-5xl mb-1">Designer Homes Stocked</div>
      <div v-if="loaded && designerHomes.length === 0">No homes for sale</div>
      <table v-else class="my-3">
        <tr>
          <th class="p-2"></th>
          <th class="p-2 text-left">Name</th>
          <th class="p-2 text-left">Price</th>
          <th class="p-2 text-left">Created By</th>
          <th class="p-2 text-left">Store</th>
          <th class="p-2"></th>
        </tr>
        <tr v-for="designerHome in designerHomes" :key="designerHome.id">
          <td class="p-2">
            <img :src="`/assets/worlds/deshomes/${designerHome.directory}/${designerHome.image}`"
                 style="max-width:100px;max-height:100px;" />
          </td>
          <td class="p-2">{{ designerHome.name }}</td>
          <td class="p-2">{{ designerHome.price }}cc</td>
          <td class="p-2">{{ designerHome.username || 'Deleted User' }}</td>
          <td class="p-2">
            <select :value="designerHome.place_id"
                    class="text-black"
                    :disabled="isProcessing"
                    @change="move(designerHome.id, $event.target.value)">
              <option v-for="store in stores" :key="store.id" :value="store.id">
                {{ store.name }}
              </option>
            </select>
          </td>
          <td class="p-2">
            <button class="btn-ui" :disabled="isProcessing" @click="remove(designerHome)">
              Remove
            </button>
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "DesignerHomesStocked",
  data: () => {
    return {
      designerHomes: [],
      stores: [],
      loaded: false,
      error: "",
      success: "",
      isProcessing: false,
    };
  },
  methods: {
    async getResults(): Promise<void> {
      try {
        const [homesResponse, storesResponse] = await Promise.all([
          this.$http.get("/designer_home/stocked"),
          this.$http.get("/designer_home/stores"),
        ]);
        this.designerHomes = homesResponse.data.designerHomes;
        this.stores = storesResponse.data.stores;
      } catch (errorResponse: any) {
        this.error = errorResponse.response?.data?.error ?? "An unknown error occurred";
      }
      this.loaded = true;
    },
    async move(id, storeId): Promise<void> {
      await this.post("/designer_home/move", { id, storeId }, "Home moved");
    },
    async remove(designerHome): Promise<void> {
      const message = `Take ${designerHome.name} off sale? Members who bought it will keep it.`;
      if(!confirm(message)) return;
      await this.post("/designer_home/remove", { id: designerHome.id }, "Home removed");
    },
    async post(endpoint, data, success): Promise<void> {
      if(this.isProcessing) return;
      this.error = "";
      this.success = "";
      this.isProcessing = true;
      try {
        await this.$http.post(endpoint, data);
        this.success = success;
      } catch (errorResponse: any) {
        this.error = errorResponse.response?.data?.error ?? "An unknown error occurred";
      }
      await this.getResults();
      this.isProcessing = false;
    },
  },
  mounted() {
    this.getResults();
  },
});
</script>
