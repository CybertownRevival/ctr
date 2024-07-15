<template>
  <Modal>
    <template v-slot:header>
        <button type="button" class="btn-ui-inline" @click="close('Modal closed')">X</button>
        <button type="button" class="btn-ui-inline" @click="openInfoModal"><</button>
    </template>
    <template v-slot:body>
      <div class="flex w-full justify-center" v-show="page === 'storage'">
        <div class="flex-1 w-4/5 border p-2">
          <h2 class="flex mb-5">{{ username }}'s Object Storage Areas</h2>
          <div class="grid w-full justify-center" style="grid-template-columns: 1fr 1fr 1fr;" v-if="units.length >= 1">
            <div v-for="(unit, key) in units" :key="key">
              <div class="flex"><div class="px-2">
                <h3>
                  <a href="#" @click="openStorageUnit(unit.id, unit.name, unit.array)">{{ unit.name }}</a> 
                  ( {{ unit.count }} 
                  <span v-if="unit.count === 1">Object</span>
                  <span v-else>Objects</span>
                   )
                </h3>
              </div></div>
            </div>
          </div>
          <div v-else>You currently have no storage areas. Click the Edit link below to add one.</div>
          <br />
          <span><a href="#" @click="openEditModal">Edit</a></span>
        </div>
      </div>
      <div class="flex w-full justify-center" v-show="page === 'unit'">
        <button class="btn-ui-inline" style="position:absolute; z-index:99; top: 3px; right: 21px;" 
          v-show="page === 'unit'" @click="backToStorage"><
        </button>
        <div class="flex-1 w-4/5 border p-2 mb-5">
          <h2 class="flex mb-5">Objects In {{ unitName }}</h2>
          <div class="grid w-full justify-center" style="grid-template-columns: 1fr 1fr 1fr 1fr;" v-if="storageObjects.length >= 1">
            <div v-for="(obj, key) in storageObjects" :key="key">
              <div class="flex">
                <div class="px-2">
                  <h3>
                    <input type="checkbox" v-model="moveToBackpack" :value="obj.id" />
                    <a href="#" @click="objectOpener(obj.id)" class="px-2">
                      <span v-if="obj.object_name !== ''">{{ obj.object_name }}</span>
                      <span v-else>{{ obj.name }}</span>
                    </a> 
                  </h3>
                </div>
              </div>
            </div>
          </div>
          <div class="flex mt-5" v-show="storageObjects.length >= 1">
            <button class="btn" @click="moveObjectsToBackpack" v-show="moveToBackpack.length >= 1">
              Remove Selected From Storage
            </button>
            <button class="btn" v-show="moveToBackpack.length === 0" @click="moveAllBackpack">
              Remove All
            </button>
          </div>
          <div v-if="storageObjects.length === 0">There are currently 0 objects in this storage unit.</div>
        </div>
      </div>
      <div class="flex w-full justify-center" v-show="username === $store.data.user.username && page === 'unit'">
        <div class="flex-1 w-4/5 border p-2">
          <h2 class="flex mb-5">My Backpack</h2>
          <div class="grid w-full justify-center" style="grid-template-columns: 1fr 1fr 1fr 1fr;">
            <div v-for="(obj, key) in backpack" :key="key">
              <div class="flex">
                <div class="px-2">
                  <h3>
                    <input type="checkbox" v-model="moveToStorage" :value="obj.id" />
                    <a href="#" @click="objectOpener(obj.id)" class="px-2">
                      <span v-if="obj.object_name !== ''">{{ obj.object_name }}</span>
                      <span v-else>{{ obj.name }}</span>
                    </a> 
                  </h3>
                </div>
              </div>
            </div>
          </div>
          <div class="flex mt-5" v-show="backpack.length >= 1">
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
    </template>
  </Modal>
</template>

<script lang="ts">
import Vue from "vue";

import Modal from './Modal.vue';
import ModalMixin from './mixins/ModalMixin';
import InfoModal from "./InfoModal.vue";
import ModalService from "./services/ModalService.vue";
import StorageEditModal from './StorageEditModal.vue';

export default Vue.extend({
  name: "StorageModal",
  components: {Modal},
  data: () => ({
      username: undefined,
      unitName: null,
      unitId: null,
      units: [],
      objects: [],
      storageObjects: [],
      backpack: [],
      moveToBackpack: [],
      moveToStorage: [],
      arrayLocator: 0,
      page: 'storage',
      showError: false,
      error: "",
      showSuccess: false,
  }),
  methods: {
    openInfoModal(): void {
      ModalService.open(InfoModal);
    },
    openEditModal(): void {
      ModalService.open(StorageEditModal);
    },
    async openStorageUnit(id, name, position) {
      this.storageObjects = []
      this.unitName = name;
      this.unitId = id;
      this.page = 'unit';
      this.storageObjects = this.objects[position];
    },
    backToStorage(){
      this.page = 'storage';
    },
    async moveObjectsToBackpack(){
      try{
        if(this.moveToBackpack.length >= 1){
          await this.$http.post('/object_instance/backpack', {
            id: this.moveToBackpack
          }).then(response => {
            if(response.data.status === 'success'){
              this.moveToBackpack = [];
            }
          })
          this.openInfoModal();
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
          }).then(response => {
            if(response.data.status === 'success'){
              this.moveToStorage = [];
            }
          })
          this.openInfoModal();
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
    async getUnits(){
      this.arrayLocator = 0;
      this.username = this.$store.data.user.username;
      try{
      this.backpack = [];
      const response = await this.$http.get(`/member/backpack/${this.username}`);
      this.backpack = response.data.objects;
       return this.$http.get(`/member/storage/`)
        .then((response) => {
          response.data.storage.forEach(unit => {
            const count = this.$http.get(`/place/${unit.id}/object_instance`);
            count.then((number) => {
              unit.count = number.data.object_instance.length;
              unit.array = this.arrayLocator;
              this.objects.push(number.data.object_instance)
              this.units.push(unit);
              this.arrayLocator++
            })
          })
        });      
      } catch (errorResponse: any) {
        console.error(errorResponse);
      }
    },
    objectOpener(id) {  
      window.open("/#/object/"+id, "targetWindow", "width=1000px,height=700px,location=0,menubar=0,status=0,scrollbars=0");
    },
  },
  mounted() {
    this.getUnits();
  },
  mixins: [ModalMixin],
});
</script>
