<template>
  <div v-if="homeDesigns.length">
    <h4 class="font-bold my-3">Your Designer Homes</h4>
    <div class="grid grid-cols-2 gap-5">
      <div v-for="homeDesign in homeDesigns" :key="homeDesign.id">
        <input type="radio"
               class="mr-3"
               :value="homeDesign.id"
               :checked="value === homeDesign.id"
               @change="$emit('input', homeDesign.id)" />
        <img :src="homeDesign.image" style="max-width:150px;max-height:150px;" /><br />
        {{ homeDesign.name }}<br />
        <strong>Owned</strong>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "DesignerHomeOptions",
  props: {
    value: {
      type: String,
      default: null,
    },
  },
  data: () => {
    return {
      homeDesigns: [],
    };
  },
  async mounted(): Promise<void> {
    const response = await this.$http.get("/designer_home/owned");
    this.homeDesigns = response.data.homeDesigns;
  },
});
</script>
