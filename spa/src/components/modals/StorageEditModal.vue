<template>
  <Modal>
    <template v-slot:header>
        <button type="button" class="btn-ui-inline" @click="close('Modal closed')">X</button>
        <button type="button" class="btn-ui-inline" @click="openStorageModal"><</button>
    </template>
    <template v-slot:body>
      <div class="flex w-full justify-center">
        <div class="flex-1 w-4/5 p-2">
          <h2 class="mb-5">Editing My Object Storage Areas</h2>
          <div class="flex-1 w-full justify-center">
            <div v-for="(unit, key) in units" :key="key">
              <div class="flex"><div>
                <h3>
                  <div class="flex mb-2">
                    <button class="btn" style="line-height:13px;" @click="editName(unit.id, unit.name)">
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
          </div>
        </div>
      </div>
      <div class="flex w-full">
        <div class="flex-1">
          <div><a href="#" @click="addStorage">Add A New Storage Area</a></div>
          <!-- Commented out until functionality is added -->
          <!-- <div><a href="#">Change Storage Access</a></div> -->
        </div>
      </div>
    </template>
  </Modal>
</template>

<script lang="ts">
import Vue from "vue";

import Modal from './Modal.vue';
import ModalMixin from './mixins/ModalMixin';
import StorageModal from "./StorageModal.vue";
import ModalService from "./services/ModalService.vue";

export default Vue.extend({
  name: "StorageEditModal",
  components: {Modal},
  data: () => ({
      username: undefined,
      unitName: null,
      unitId: null,
      units: [],
      objects: [],
      storageObjects: [],
      showError: false,
      error: "",
      showSuccess: false,
  }),
  methods: {
    openStorageModal(): void {
      ModalService.open(StorageModal);
    },
   async editName(id, name) {
      let newName = prompt("Current Name:\n " + name + "\n\nNew name may only contain:\n0-9\na-z\nA-Z\nspaces\n- / [ ] ( )\n\nNew Name:", name);
      if(newName !== null && newName !==''){
        try {
          newName = newName.replace(/[^0-9a-zA-Z \-\[\]\/()]/g, '');
          const badwords = require("badwords-list");
          const bannedwords = badwords.regex;
          if(newName.match(bannedwords)){
            alert('You can not use this type of language on CTR!');
            newName = name;
            return
          }
          await this.$http.post("/member/storage/update/", {
            id: id,
            content: newName
          });
        } catch(error) {
          console.error(error);
        } finally {
          await this.getUnits();
        }
      }
    },
    async addStorage(){
      let newStorage = prompt("Add a new storage area.\n\nStorage name may only contain:\n0-9\na-z\nA-Z\nspaces\n- / [ ] ( )\n\nPlease enter the name of the new storage area:")
      if(newStorage !== null && newStorage !== ''){
        try {
          newStorage = newStorage.replace(/[^0-9a-zA-Z \-\[\]\/()]/g, '');
          const badwords = require("badwords-list");
          const bannedwords = badwords.regex;
          if(newStorage.match(bannedwords)){
            alert('You can not use this type of language on CTR!');
            return
          }
          await this.$http.post("/place/add_storage", {name: newStorage})
        } catch (error) {
          console.error(error);
        } finally {
          await this.getUnits();
        }
      }
    },
    async getUnits(){
      this.units = [];
      this.username = this.$store.data.user.username;
      try{
        const storageUnits = await this.$http.get(`/member/storage`);
        storageUnits.data.storage.forEach(unit => {
          this.units.push(unit);
        });
      } catch (errorResponse: any) {
        console.error(errorResponse);
      }
    },
  },
  mounted() {
    this.getUnits();
  },
  mixins: [ModalMixin],
});
</script>
