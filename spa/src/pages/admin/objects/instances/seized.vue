<template>
  <div class="flex-1">
    <div class="flex justify-center">
      <h1>
        Seized Objects
      </h1>
    </div>
    <div class="flex w-full justify-center p-5">
      Total Objects: {{ objects.length }}
    </div>
    <div class="flex justify-center">
      <div class="pr-5">{{ setNewOwner.length }} Selected </div>
      <input type="text" v-model="newOwner" style="color: black;" />
      <button class="btn-ui-inline" @click="updateObjectOwner()">Set New Owner</button>
    </div>
    <div class="flex w-full justify-center p-5">
      <button class="btn-ui-inline" @click="selectAll()">Select All</button>
      <button class="btn-ui-inline" @click="deselectAll()">Deselect All</button>
    </div>
    <div class="grid w-full grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div v-for="(obj, key) in objects" :key="key" class="min-w-0">
          <div class="overflow-x-hidden whitespace-nowrap">
            <input type="checkbox" v-model="setNewOwner" :value="obj.id" />
              <span v-if="obj.object_name !== ''">{{ obj.object_name }}</span>
              <span v-else>{{ obj.name }}</span>
          </div>
        </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  name: "SeizedObjects",
  data: () => {
    return {
      accessLevel: null,
      objects: [],
      setNewOwner: [],
      newOwner: null,
    };
  },
  methods: {
    async getAdminLevel(): Promise<void> {
      try{
        const access = await this.$http.get("/member/getadminlevel");
        this.accessLevel = access.data.accessLevel;
        this.accessCheck();
      } catch (e) {
        console.log(e);
      }
    },
    accessCheck() {
      if (!this.accessLevel.includes('admin')){
        this.$router.push({name: "restrictedaccess"});
      }
    },
    async getObjectList() {
      this.objects = [];
      const seizedObjects = await this.$http.get("/object_instance/seized_objects");
      this.objects = seizedObjects.data.objects;
    },
    selectAll() {
      this.setNewOwner = [];
      this.objects.forEach(object => {
        this.setNewOwner.push(object.id);
      })
    },
    deselectAll() {
      this.setNewOwner = [];
    },
   async updateObjectOwner(): Promise<void> {
    if(this.setNewOwner.length >= 1 && this.newOwner) {
      const updateObject = await this.$http.post("/object_instance/update_owner", {
        id: this.setNewOwner, username: this.newOwner,
      })
      if(updateObject){
        this.setNewOwner = [];
        this.getObjectList();
      }
    }
   },
  },
  created() {
    this.getAdminLevel();
  },
  mounted() {
    this.getObjectList();
  },
});
</script>
