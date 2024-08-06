<template>
	<div class="w-full flex">
    <div class="flex flex-col w-full place-items-center">
    <div class="text-red-500" v-show="error">{{ error }}</div>
    <div class="text-center w-full text-5xl mb-1">Mall Warehouse</div>
    <div class="grid grid-cols-2 w-4/6 justify-items-center">
      <div>
      </div>
      <div>
        View Amount:
        <select v-model="limit" @change="getResults">
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
          <div class="flex" v-if="object.instances >= 1"><div class="w-24">Sold: </div><div>{{ object.instances }}</div></div>
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
            <button class="btn-ui" @click="refundUnsoldQuantity(object.id)">Destock</button>
          </div>
        </div>
        <div>
          <div>
            Select a Store:<br />
            <select v-model="store">
              <option v-for="option in mallStoreData" :value="option.id">
                {{ option.title }}
              </option>
            </select>
            <br /><br />
          </div>
          <button class="btn-ui" @click="drop(object.id)">Drop</button>
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
  name: "MallWarehouse",
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
      column: 'status',
      compare: '=',
      content: 3,
      store: null,
      mallStoreData: [],
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
    async getResults(): Promise<void> {
      this.objects = [];
      try {
        const response = await this.$http.get(`/mall/all_objects`,
        {
          column: this.column,
          compare: this.compare,
          content: this.content,
          limit: this.limit,
          offset: this.offset,
        }
        );
        this.totalCount = response.data.objects.total[0].count;
        this.objects = response.data.objects.objects;
        this.showSuccess = true;
      } catch (errorResponse: any) {
        if (errorResponse.response.data.error) {
          this.error = errorResponse.response.data.error;
          this.showError = true;
        } else {
          this.error = "An unknown error occurred";
          this.showError = true;
        }
      }
    },
    async getStores(){
      const stores = await this.$http.get(`/mall/stores`);
      stores.data.stores.forEach(store => {
        this.mallStoreData.push({
          title: store.name,
          id: store.id
        })
      })
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
            this.getResults();
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
            this.getResults();
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
    async refundUnsoldQuantity(objectId): Promise<void> {
      try {
        this.error = '';
        this.showError = false;
        await this.$http.post("/mall/refund", {
        'id': objectId,
        });
        this.success = 'Object updated to deleted status.';
        this.showSuccess = true;
        this.getResults();
      } catch (errorResponse: any) {
        if (errorResponse.response.data.error) {
          this.error = errorResponse.response.data.error;
          this.showError = true;
        } else {
          this.error = "An unknown error occurred";
          this.showError = true;
        }
      }

    },
    async drop(objectId): Promise<void> {
      this.showSuccess = false;
      this.showError = false;
      try {
        if(!this.store){
          this.error = 'You must select a store!';
          this.showError = true;
        } else {
          this.error = '';
          this.showError = false;
          await this.$http.post("/mall/drop", {
          'objectId': objectId,
          'shopId': this.store
          }).then((response) => {
            if(response.data.status === 'success'){
              this.success = 'Object dropped';
              this.showSuccess = true;
              this.store = null;
            }
          });
        }
      } catch (errorResponse: any) {
        if (errorResponse.response.data.error) {
          this.error = errorResponse.response.data.error;
          this.showError = true;
        } else {
          this.error = "An unknown error occurred";
          this.showError = true;
        }
      } finally {
        await this.getResults();
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
    this.getStores();
    this.getResults();  
  },
});
</script>
