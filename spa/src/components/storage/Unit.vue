<template>
<div class="w-full" v-if="(showStorage || unitOwner === $store.data.user.id) && !areaDeleted">
  <div class="flex w-full h-full justify-center" :style="{'height' :panelMaxHeight}">
    <div class="flex-1 w-full border p-2">
      <h2 class="flex mb-5">Objects In {{ unitName }}</h2>
      <div class="mb-5" v-if="storageObjects.length >= 1">{{ storageObjects.length }} object<span v-if="storageObjects.length !== 1">s</span> in this area</div>
      <div class="flex flex-wrap w-full overflow-y-auto" :style="{'max-height' :maxHeight}" v-if="storageObjects.length >= 1">
        <div v-for="(obj, key) in storageObjects" :key="key">
          <div class="overflow-x-hidden whitespace-nowrap" style="width:300px;">
            <input type="checkbox" v-model="moveToBackpack" :value="obj.id" v-if="unitOwner === $store.data.user.id" />
            <a href="#" class="text-lg px-2" @click.prevent="objectOpener(obj.id)">
              <span v-if="obj.object_name !== ''">{{ obj.object_name }}</span>
              <span v-else>{{ obj.name }}</span>
            </a> 
          </div>
        </div>
      </div>
      <div class="flex mt-5" v-if="storageObjects.length >= 1 && unitOwner === $store.data.user.id">
        <button class="btn" @click="moveObjectsToBackpack" v-show="moveToBackpack.length >= 1">
          Remove Selected From Storage
        </button>
        <button class="btn" v-show="moveToBackpack.length === 0" @click="moveAllBackpack">
          Remove All
        </button>
      </div>
      <div v-if="storageObjects.length === 0">
        <span>No objects in this area.</span>
        <br />
        <a href="#" @click.prevent="deleteStorageArea" v-if="unitOwner === $store.data.user.id">Delete Storage Area</a>
      </div>
      <br />
    </div>
  </div>
  <div class="flex w-full h-full justify-center" :style="{'height' :panelMaxHeight}" v-if="unitOwner === $store.data.user.id">
    <div class="flex-1 w-full border p-2">
      <h2 class="flex mb-5">My Backpack</h2>
      <div class="mb-5">{{ backpack.length }} object<span v-if="backpack.length !== 1">s</span> in your backpack.</div>
      <div class="flex flex-wrap w-full overflow-y-auto" :style="{'max-height' :maxHeight}">
        <div v-for="(obj, key) in backpack" :key="key">
          <div>
            <div class="px-2 overflow-x-hidden">
              <h3 class="overflow-x-hidden whitespace-nowrap" style="width:300px;">
                <input type="checkbox" v-model="moveToStorage" :value="obj.id" />
                <a href="#" class="text-lg px-2" @click.prevent="objectOpener(obj.id)">
                  <span v-if="obj.object_name !== ''">{{ obj.object_name }}</span>
                  <span v-else>{{ obj.name }}</span>
                </a> 
              </h3>
            </div>
          </div>
        </div>
      </div>
      <div class="flex mt-5" v-if="backpack.length >= 1 && unitOwner === $store.data.user.id">
        <button class="btn" @click="moveObjectsToStorage" v-show="moveToStorage.length >= 1">
          Add Selected To Storage
        </button>
        <button class="btn" v-show="moveToStorage.length === 0" @click="moveAllStorage">
          Add All
        </button>
      </div>
      <div v-if="backpack.length === 0">There are currently 0 objects in your backpack.</div>
    </div>
  </div>
</div>
<div class="flex w-full justify-center" v-else-if="areaDeleted">
  <span class="mt-10 font-bold" style="color:lime;">This storage area has been deleted. Please close this window.</span>
</div>
<div class="flex w-full justify-center" v-else>
  <span class="mt-10 font-bold" style="color:lime;">This storage area is private.</span>
</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "StorageUnit",
  data: () => ({
    unitName: null,
    unitOwner: null,
    unitId: null,
    objects: [],
    storageObjects: [],
    backpack: [],
    moveToBackpack: [],
    moveToStorage: [],
    showError: false,
    error: "",
    showSuccess: false,
    showStorage: false,
    maxHeight: '180px',
    panelMaxHeight: '340px',
    areaDeleted: false,
  }),
  methods: {
    async getStorageObjects(){
      this.moveToBackpack = [];
      this.moveToStorage = [];
      this.storageObjects = []
      const storage = await this.$http.get(`/place/${this.unitId}/object_instance`);
      this.storageObjects = storage.data.object_instance;
    },
    async getBackpackObjects(){
      this.moveToBackpack = [];
      this.moveToStorage = [];
      this.backpack = [];
      const response = await this.$http.get(`/member/backpack/${this.$store.data.user.username}`);
      this.backpack = response.data.objects;
    },
    async getOwnerDetails(){
      console.log("Get Owner Details", parseInt(this.unitId))
      const place = await this.$http.get(`/place/by_id/${this.unitId}`);
      this.unitName = place.data.place.name;
      this.unitOwner = place.data.place.member_id;
      if(this.unitOwner !== this.$store.data.user.id){
        this.maxHeight = '585px'
        this.panelMaxHeight = '680px'
      }
    },
    async moveObjectsToBackpack(){
      try{
        if(this.moveToBackpack.length >= 1){
          await this.$http.post('/object_instance/backpack', {
            id: this.moveToBackpack
          });
          this.getStorageObjects();
          this.getBackpackObjects();
        }
      } catch (error) {
        console.log(error);
      }
    },
    async moveObjectsToStorage(){
      try{
        if(this.moveToStorage.length >= 1){
          await this.$http.post('/object_instance/storage', {
            id: this.moveToStorage,
            place_id: this.unitId
          });
          this.getStorageObjects();
          this.getBackpackObjects();
        }
      } catch (error) {
        console.log(error);
      }
    },
    moveAllBackpack(){
      if(confirm("This will remove all the items in this storage unit and place them in your backpack.\n\nDo you want to continue?")){
        this.storageObjects.forEach(obj => {
          this.moveToBackpack.push(obj.id);
        })
        this.moveObjectsToBackpack();
      }
    },
    moveAllStorage(){
      if(confirm("This will remove all the items from your backpack and place them in this storage unit.\n\nDo you want to continue?")){
        this.backpack.forEach(obj => {
          this.moveToStorage.push(obj.id);
        })
        this.moveObjectsToStorage();
      }
    },
    objectOpener(id) {  
      window.open("/#/object/"+id, "_targetWindow", "width=1000px,height=700px,location=0,menubar=0,status=0,scrollbars=0");
    },
    async deleteStorageArea(){
      try{
        if(this.storageObjects.length === 0){
          await this.$http.post('/place/delete_storage', {
            id: this.unitId,
          }).then(() => {
            this.areaDeleted = true;
          })
        }
    } catch(error) {
      console.log(error);
    }
    },
    async checkStorageStatus() {
      const place = await this.$http.get(`/place/by_id/${this.unitId}`);
      if(place.data.place.status === 0){
        this.areaDeleted = true;
      }
    }
  },
  created() {
    this.unitId = this.$route.params.id;
    this.checkStorageStatus();
  },
  mounted() {
    this.getStorageObjects();
    this.getBackpackObjects();
    this.getOwnerDetails();
  },
});
</script>
