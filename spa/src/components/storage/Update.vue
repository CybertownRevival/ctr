<template>
  <div class="flex w-full h-full justify-center">
    <div class="flex-1 h-full p-2" v-if="page === 'updateStorage'">
      <h1 class="mb-5 justify-center">Update Storage Area Names</h1>
      <div class="pb-5 justify-center font-bold">
        <h3>Your Storage Areas: <span style="color:lime;">{{ units.length }}</span> / {{ storageLimit }}</h3>
      </div>
      <div class="flex-1 h-full w-full justify-center">
        <div v-for="(unit, key) in units" :key="key">
          <div class="flex">
            <div class="text-2xl">
              <div class="flex mb-2">
                <a href="#" v-if="unit.name"
                @click.prevent="updateName(unit.id, unit.name, unit.count), changePage('updateName')">
                  {{ unit.name }}
                </a>
                <button class="btn-ui" v-else
                @click.prevent="updateName(unit.id, unit.name, unit.count), 
                changePage('updateName')">Add Name</button>
                <span class="flex px-2">( {{ unit.count }} </span>
                  <span v-if="unit.count === 1">Object </span>
                  <span v-else>Objects </span>
                  <span class="flex px-2">)</span>
              </div>
            </div>
          </div>
        </div>
        <div class="py-5">
          <div class="flex" v-if="units.length < storageLimit">
            <h3>
              <a href="#" @click.prevent="addStorage()">Create New Area</a>
            </h3>
          </div>
          <div class="flex">
            <h3>
              <a href="#" @click.prevent="changePage('updateAccess')">Change Object Access</a>
            </h3>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="page === 'updateName'">
      <h1 class="mb-5">Update Storage Area {{ unitName }}</h1>
      <input type="text" style="color:black;" v-model="unitNewName" /> ( {{ unitCount }} 
      <span v-if="unitCount === 1">Object</span>
      <span v-else>Objects</span>
      )
      <div class="flex py-5">
        <button class="btn mx-2" @click="editName()">Update</button>
        <button class="btn mx-2" @click="changePage('updateStorage')">Cancel</button>
      </div>
    </div>
    <div v-else>
      <h1 class="mb-5">Object Storage Area Access</h1>
      <span class="text-lg" style="color:lime;">Coming soon<br /> Storage areas are <br /><b>Private/Hidden</b><br /> by default.</span><br />
      <div class="hidden">
        <input type="radio" id="public" name="storageAccess" value="public" v-model="access">
        <lable for="public">Everybody can see the objects.</lable>
        <br />
        <input type="radio" id="private" name="storageAccess" value="private" v-model="access">
        <lable for="private">Nobody can see the objects.</lable>
        <br />
      </div>
      <div class="flex py-5">
        <button class="btn mx-2 hidden" @click="updateAccess()">
          Update
        </button>
        <button class="btn" @click="changePage('updateStorage')">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from"vue";

export default Vue.extend({
  name: "UpdateStorageAreas",
  data: () => ({
    units: [],
    unitName: null,
    unitNewName: null,
    unitId: null,
    unitCount: null,
    page: 'updateStorage',
    access: 'private',
    storageLimit: 36,
  }),
  methods: {
    async updateName(id, name, count) {
      this.unitId = id;
      this.unitName = name;
      this.unitCount = count;
      this.unitNewName = name;
    },
    async editName() {
      try {
        this.unitNewName = this.unitNewName.replace(/[^0-9a-zA-Z \-\[\]\/()]/g, '');
        let emptyNameTest = this.unitNewName.replace(/[^0-9a-zA-Z\-\[\]\/()]/g, '');
        const badwords = require("badwords-list");
        const bannedwords = badwords.regex;
        if(this.unitNewName.match(bannedwords)){
          alert('You can not use this type of language on CTR!');
          this.unitNewName = this.unitName;
          return
        }
        if(!this.unitNewName || !emptyNameTest){
          alert('You must enter a name for your storage area.');
          this.unitNewName = this.unitName;
          return
        }
        await this.$http.post("/member/storage/update/", {
          id: this.unitId,
          content: this.unitNewName
        });
      } catch(error) {
        console.error(error);
      } finally {
        await this.getUnits();
        this.page = 'updateStorage';
        this.units = [];
        this.getUnits();
      }
    },
    async updateAccess() {
      console.log("UpdateAccess")
    },
    async getUnits(){
      this.units = [];
      try{
        const storageUnits = await this.$http.post(`/member/storage`, {
          member_id: this.$store.data.user.id,
        });
        storageUnits.data.storage.forEach(unit => {
          this.units.push(unit);
        });
      } catch (errorResponse: any) {
        console.error(errorResponse);
      }
    },
    changePage(page) {
      this.page = page;
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
  },
  mounted() {
    this.getUnits();
  },
});
</script>
