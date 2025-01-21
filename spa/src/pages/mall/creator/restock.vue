<template>
	<div class="w-full flex">
    <div class="flex flex-col w-full place-items-center">
    <div class="text-red-500" v-show="error">{{ error }}</div>
    <div class="text-center w-full text-5xl mb-1">My Restockable Objects</div>
    <div class="grid grid-cols w-4/6 justify-items-center">
      <div class="mt-5">
        <select v-model.number="sortList" @change="getResults()">
          <option value=9>All Restockable</option>
          <option value=1>Stocked</option>
          <option value=4>Destocked</option>
        </select>
      </div>
      <div></div>
    </div>
    <br />
    <div class="grid-cols-1 w-4/6 justify-items-center text-center ">
      Total Count: {{ total }} <br /><br />
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
          <div class="flex"><div class="w-24">Quantity: </div><div>{{ object.quantity }}</div></div>
          <div class="flex">
            <div class="w-24">Limit: </div>
            <div v-if="object.limit">{{ object.limit }}</div>
            <div v-else>Unlimited</div>
          </div>
          <div class="flex"><div class="w-24">Unsold: </div><div>{{ object.quantity - object.instances }}</div></div>
          <div class="flex" v-if="object.status === 1">
            <div class="w-24">Store: </div>
            <div>{{ object.store.name }}</div>
          </div>
          <br />
          <div class="flex">
            <div class="w-24">Uploaded: </div>
            <div>
              {{ new Date(object.created_at)
                .toLocaleString('en-US', {
                  month: 'numeric',
                  day:'numeric',
                  year: 'numeric'}) }}
            </div>
          </div>
          <div>
            <br />
            <button class="btn-ui" @click="addQuantity(object.id)" v-show="['Unlimited', '0', 0, null].includes(object.limit) || object.quantity < object.limit">Add More</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "CreatorCatalog",
  data: () => {
    return {
      canAdmin: false,
      objects: [],
      total: 0,
      showError: false,
      error: '',
      success: '',
      showSuccess: false,
      loaded: false,
      limit: 1000,
      offset: 0,
      showNext: true,
      sortList: 9,
    };
  },
  methods: {
    async getResults(): Promise<void> {
      this.objects = [];
      try {
        const response = await this.$http.post(`/mall/user`, {
          username: this.$store.data.user.username,
          compare: 1,
          status: 2,
          limit: this.limit,
          offset: this.offset,
        });
        response.data.object.objects.forEach(obj => {
        if((['Unlimited', '0', 0, null].includes(obj.limit) ||
          obj.quantity < parseInt(obj.limit)) && obj.status !== 0) 
          {
            if(this.sortList === obj.status){
              this.objects.push(obj);
            }
            if(this.sortList === 9){
              this.objects.push(obj);
            }
          }
        })
        this.total = this.objects.length;
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
    async addQuantity(objectId): Promise<void>{
      this.showSuccess = false;
      this.showError = false;
      let qty = prompt("Increase quantity of this object\n You will be charged 20% of the total. (Price x Additional Quantity)\n You can add up to 100 at a time.");
      if(qty !== qty.replace(/[^0-9]/g, '')){
        this.success = '';
        this.error = 'Please only use positive whole numbers';
        return;
      }
      if(parseInt(qty) > 100){
        this.success = '';
        this.error = 'You can only add up to 100 at a time.';
        return;
      }
      if(qty !== null && qty !==''){
      try {
        this.error = '';
        this.success = '';
        this.showError = false;
        await this.$http.post("/object/increase_quantity", {
        'objectId': objectId,
        'qty': parseInt(qty.replace(/[^0-9]/g, '')),
        });
        this.objects = [];
        this.getResults();
        this.success = "Quantity added successfully!"
      } catch (errorResponse: any) {
        if (errorResponse.response.data.error) {
          this.error = errorResponse.response.data.error;
          this.showError = true;
        } else {
          this.error = "An unknown error occurred";
          this.showError = true;
        }
      }} else {
        this.error = "You can not add more than what the object is limited to!"
      }
    },
  },
	async mounted(): Promise<void> {
    this.loaded = true;
    this.getResults();
  },
  watch: {
  },
});
</script>
