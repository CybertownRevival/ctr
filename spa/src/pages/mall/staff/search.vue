<template>
	<div class="w-full flex">
    <div class="flex flex-col w-full place-items-center">
    <div class="text-red-500" v-show="error">{{ error }}</div>
    <div class="text-center w-full text-5xl mb-1">Mall Object Search</div>
    <div class="grid grid-cols-2 w-4/6 justify-items-center">
      <div>
        Search Mall Objects: 
        <input class="text-black" type="text" v-model="search" @input="searchObjects"/>
      </div>
      <div>
        View Amount:
        <select v-model="limit" @change="searchObjects">
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>
    </div>
    <br />
    <div class="grid-cols-1 w-4/6 justify-items-center text-center ">
      Total Count: {{ totalCount }} <br /><br />
    </div>
    <div class="flex" style="margin-bottom: 2rem;" v-for="object in objects"
          :key="object.id">
      <div class="w-full flex border">
        <div>
          <div class="flex justify-center" style="min-width:250px;min-height:250px;">
            <img :src="'/assets/object/'+object.directory + '/' + object.image" 
                  style="max-width:250px;max-height:250px;height:auto;width:auto;"
                />
          </div>
        </div>
        <div class="w-80">
          <div class="flex"><div class="w-24">Name: </div><div>{{ object.name }}</div></div>
          <div class="flex"><div class="w-24">Price: </div><div>{{ object.price }}</div></div>
          <div class="flex"><div class="w-24">Sold: </div><div>{{ object.instances }}</div></div>
          <div class="flex"><div class="w-24">Quantity: </div><div>{{ object.quantity }}</div></div>
          <div class="flex">
            <div class="w-24">Limit: </div>
            <div v-if="object.limit">{{ object.limit }}</div>
            <div v-else>Unlimited</div>
          </div>
          <div class="flex"><div class="w-24">Created By: </div><div>{{ object.username }}</div></div>
        </div>
        <div>
          <div class="w-40">
            <button class="btn-ui" @click="updateName(object.id, object.name)">Edit Name</button>
            <button class="btn-ui" @click="updateLimit(object.id, object.quantity)">Update Limit</button>
          </div>
        </div>
        <div>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-2 w-4/6 justify-items-center">
      <div class="p-1 text-right w-full">
        <button class="btn"
                @click="back"
                v-show="offset != 0">
          BACK
        </button>
      </div>
      <div class="p-1 text-left w-full">
        <button class="btn"
                @click="next"
                v-show="totalCount - offset >= limit">
          NEXT
        </button>
      </div>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "MallObjectSearch",
  data: () => {
    return {
      canAdmin: false,
      objects: [],
      showError: false,
      error: '',
      success: '',
      showSuccess: false,
      loaded: false,
      totalCount: 0,
      limit: 10,
      offset: 0,
      showNext: true,
      search: "",
    };
  },
  methods: {
    async isMallStaff() {
      try {
        await this.$http.get(
          `/mall/can_admin`,
        );
        this.canAdmin = true;
      } catch (e) {
        console.log(e);
      }
    },
    async searchObjects(): Promise<any> {
      this.offset = 0;
      try {
        const searched =  await this.$http.get("/mall/objectsearch/", {
            limit: this.limit,
            offset: this.offset,
            search: this.search,
          });
          this.objects = searched.data.results.objects;
          this.totalCount = searched.data.results.total[0].count;
      } catch (error) {
        console.log(error);
      }
    },
    async getResults(): Promise<void> {
      try {
        const searched =  await this.$http.get("/mall/objectsearch/", {
            limit: this.limit,
            offset: this.offset,
            search: this.search,
          });
          this.objects = searched.data.results.objects;
          this.totalCount = searched.data.results.total[0].count;
      } catch (error) {
        console.log(error);
      }
    },
    async updateLimit(objectId, quantity): Promise<void>{
      this.showSuccess = false;
      this.showError = false;
      let limit = prompt("Update limit to this object\n NOTE: Setting the limit to 0 makes it Unlimited\n");
      if(limit !== limit.replace(/[^0-9]/g, '')){
        this.error = "Use whole numbers only!";
        return
      }
      if(limit !== null && limit !=='' && limit >= quantity ||
        limit !== null && limit !=='' && limit === '0'
      ){
        try {
            this.error = '';
            this.showError = false;
            await this.$http.post("/mall/limit", {
            'objectId': objectId,
            'limit': limit.replace(/[^0-9]/g, ''),
            });
            this.success = 'Object limit updated!';
            this.showSuccess = true;
            this.searchObjects();
          } catch (errorResponse: any) {
            if (errorResponse.response.data.error) {
              this.error = errorResponse.response.data.error;
              this.showError = true;
            } else {
              this.error = "An unknown error occurred";
              this.showError = true;
            }
          }
      }
    },
    async updateName(objectId, name): Promise<void>{
      this.showSuccess = false;
      this.showError = false;
      let newName = prompt("Current Name:\n " + name + "\n\nNew Name:", name);
      if(newName !== null && newName !==''){
        try {
            this.error = '';
            this.showError = false;
            await this.$http.post("/mall/updateObjectName", {
            'objectId': objectId,
            'name': newName,
            });
            this.success = 'Object name updated!';
            this.showSuccess = true;
            this.searchObjects();
          } catch (errorResponse: any) {
            if (errorResponse.response.data.error) {
              this.error = errorResponse.response.data.error;
              this.showError = true;
            } else {
              this.error = "An unknown error occurred";
              this.showError = true;
            }
          }
      }
    },
    async next() {
      this.offset = this.offset + this.limit;
      await this.getResults();
    },
    async back() {
      this.offset = this.offset - this.limit;
      await this.getResults();
      this.showNext = true;
    },
  },
	async mounted(): Promise<void> {
    this.loaded = true;
    this.isMallStaff();
    this.searchObjects();  
  },
});
</script>
