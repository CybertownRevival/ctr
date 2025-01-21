<template>
  <div class="flex w-3/4 justify-center p-5">
    <div class="flex-1 w-4/5 p-2">
      <h2 class="flex mb-2">Object Storage Areas ( {{ units.length }} )</h2>
      <div class="grid w-full" v-if="units.length >= 1" style="grid-template-columns: repeat(3, 1fr); gap: .25rem;  max-height:200px; overflow-y: auto;">
        <div v-for="(unit, key) in units" :key="key">
          <div class="flex">
            <div class="px-2">
              <h3>
                <a href="#" @click="storageOpener(unit.id)">{{ unit.name }}</a> 
                ( {{ unit.count }} 
                <span v-if="unit.count === 1">Object</span>
                <span v-else>Objects</span>
                  )
              </h3>
            </div>
          </div>
        </div>
      </div>
      <div class="flex" v-else><h3 style="color:lime;">Create</h3></div>
      <br />
      <div class="flex">
        <h3 style="color:lime;" v-if="units.length >= 1">Edit</h3>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "UserStorage",
  data: () => ({
    username: undefined,
      unitName: null,
      unitId: null,
      units: [],
      showError: false,
      error: "",
      showSuccess: false,
  }),
  methods: {
    async getUnits(){
      this.username = this.$store.data.user.username;
      this.units = [];
      try{
        const storageUnits = await this.$http.get(`/member/storage`);
        storageUnits.data.storage.forEach(unit => {
          this.units.push(unit);
        });
      } catch (errorResponse: any) {
        console.error(errorResponse);
      }
    },
    storageOpener(id) {  
      window.open("/#/object/"+id, "targetWindow", "width=1000px,height=700px,location=0,menubar=0,status=0,scrollbars=0");
    },
  },
  mounted() {
    this.getUnits();
  }
});
</script>