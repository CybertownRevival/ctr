<template>
  <div class="flex w-7/8 justify-center p-5">
    <div class="flex-1 w-4/5 p-2">
      <h2 class="flex mb-2">Object Storage Areas</h2>
      <div class="flex w-full justify-left flex-wrap overflow-y-auto" v-if="units.length >= 1" style="max-height: 180px;">
        <div v-for="(unit, key) in units" :key="key">
          <div class="px-2 text-left" style="width: 325px;">
            <h3>
              <a href="#" class="text-lg" v-if="unit.name" @click.prevent="storageOpener(unit.id)">{{ unit.name }}</a>
              <a href="#" class="text-lg" v-else @click.prevent="storageOpener(unit.id)">Empty Name</a>
              ( {{ unit.count }} 
              <span v-if="unit.count === 1">Object</span>
              <span v-else>Objects</span>
                )
            </h3>
          </div>
        </div>
      </div>
      <div class="flex" v-else>
        <h3 v-if="member_id === this.$store.data.user.id">
          <a href="#" class="text-lg" @click.prevent="addStorage()">Create</a>
        </h3>
      </div>
      <br />
      <div class="flex">
        <h3 v-if="units.length >= 1 && member_id === this.$store.data.user.id">
          <a href="#" class="text-lg" @click.prevent="updateStorageAreas()">Edit</a>
        </h3>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "UserStorage",
  props: ["member_id"],
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
        const storageUnits = await this.$http.post(`/member/storage`, {
          member_id: this.member_id,
        });
        storageUnits.data.storage.forEach(unit => {
          this.units.push(unit);
        });
      } catch (errorResponse: any) {
        console.error(errorResponse);
      }
    },
    async addStorage(){
      let newStorage;
      if(this.units.length < 10){
        newStorage = "Area0" + this.units.length;
      } else {
        newStorage = "Area" + this.units.length;
      } 
      try {
        await this.$http.post("/place/add_storage", {name: newStorage})
      } catch (error) {
        console.error(error);
      } finally {
        await this.getUnits();
      }
    },
    storageOpener(id) {  
      window.open("/#/storage/unit/"+id, "targetWindow", "width=1000px,height=700px,location=0,menubar=0,status=0,scrollbars=0");
    },
    updateStorageAreas() {
      window.open("/#/storage/update", "targetWindow", "width=1000px,height=700px,location=0,menubar=0,status=0,scrollbars=0");
    },
  },
  mounted() {
    this.getUnits();
  }
});
</script>
