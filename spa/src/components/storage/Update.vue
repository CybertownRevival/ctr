<template>
  <div class="flex w-full justify-center">
    <div class="flex-1 w-4/5 p-2" v-if="page === 'updateStorage'">
      <h2 class="mb-5">Update Storage Area Names</h2>
      <div class="flex-1 w-full justify-center">
        <div v-for="(unit, key) in units" :key="key">
          <div class="flex"><div>
            <h3>
              <div class="flex mb-2">
                <button class="btn" style="line-height:13px;" @click="updateName(unit.id, unit.name, unit.count), changePage('updateName')">
                  {{ unit.name }}
                </button>
                <span class="flex px-2">( {{ unit.count }} </span>
                  <span v-if="unit.count === 1">Object </span>
                  <span v-else>Objects </span>
                  <span class="flex px-2">)</span>
              </div>
            </h3>
          </div></div>
        </div>
        <div class="flex" v-if="units.length < 50">
          <h3>
            <button @click="addStorage()" style="color:lime; text-decoration: underline;">Create New Area</button>
          </h3>
        </div>
        <div class="flex">
          <h3>
            <button @click="changePage('updateAccess')" style="color:lime; text-decoration: underline;">Change Object Access</button>
          </h3>
        </div>
      </div>
    </div>
    <div v-else-if="page === 'updateName'">
      <h2 class="mb-5">Update Storage Area {{ unitName }}</h2>
      <input type="text" style="color:black;" v-model="unitNewName" /> ( {{ unitCount }} 
      <span v-if="unitCount === 1">Object</span>
      <span v-else>Objects</span>
      )
      <div class="flex mt-5">
        <button class="btn mx-2" @click="editName()">Update</button>
        <button class="btn mx-2" @click="changePage('updateStorage')">Cancel</button>
      </div>
    </div>
    <div v-else>
      <h2 class="mb-5">Object Storage Area Access</h2>
      <span style="color:lime;">Coming soon<br /> Storage areas are <br /><b>Private/Hidden</b><br /> by default.</span><br />
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
        console.log(this.unitName, this.unitNewName);
        this.unitNewName = this.unitNewName.replace(/[^0-9a-zA-Z \-\[\]\/()]/g, '');
        const badwords = require("badwords-list");
        const bannedwords = badwords.regex;
        if(this.unitNewName.match(bannedwords)){
          alert('You can not use this type of language on CTR!');
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