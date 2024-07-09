<template>
  <main v-if="loaded" class="w-full flex h-full">
    <div class="flex-col w-56 h-full border-r-2 border-white text-center">
      <br />
      <div class="mb-2"><button class="btn-ui" @click="changePage('pending')">Pending</button></div>
      
      <div class="mb-2"><button class="btn-ui" @click="changePage('stocked')">Stocked</button></div>
      <div class="mb-2"><button class="btn-ui" @click="changePage('restock')">Restock</button></div>
      <br />
      <div class="mb-2"><button class="btn-ui" @click="changePage('catalog')">My Catalog</button></div>
      <br />
      <div class="mb-2"><button class="btn-ui" @click="close()">Close</button></div>
    </div>
    <div class="w-full p-1 h-full overflow-y-scroll text-center" v-show="page !== ''">
      <div v-if="error" class="w-full flex justify-center text-red-500">{{ error }}</div>
      <div v-if="success" class="w-full flex justify-center" style="color: lime;">{{ success }}</div>
      <h2>{{ title }}</h2>
      <br />
      <div class="grid gap-6" style="grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));">
        <div v-for="(object,key) in objects" :key="key">
          <div class="border">
            <div class="flex">
              <div>
                <img :src="'/assets/object/'+object.directory + '/' + object.image" 
                  style="max-width:250px;max-height:250px;height:auto;width:auto;"
                />
              </div>
              <div class="flex flex-col w-full" style="min-height: 250px;">
                  <div class="flex">
                    <div class="w-20 text-left px-2">Name: </div><div>&nbsp;{{ object.name }}</div>
                  </div>
                  <div class="flex">
                    <div class="w-20 text-left px-2">Price: </div><div>&nbsp;{{ object.price }}</div>
                  </div>
                  <div class="flex">
                    <div class="w-20 text-left px-2">Quantity: </div><div>&nbsp;{{ object.quantity }}</div>
                  </div>
                  <div class="flex">
                    <div class="w-20 text-left px-2" v-show="page !== 'pending'">Limit: </div><div v-show="page !== 'pending'">&nbsp;{{ object.limit }}</div>
                  </div>
                  <div v-show="object.instances > 0" class="flex">
                    <div class="w-20 text-left px-2">Sold: </div><div>&nbsp;{{ object.instances }}</div>
                  </div>
                  <div v-show="object.instances < object.quantity && page === 'restock'" class="flex">
                    <div class="w-20 text-left px-2">Unsold: </div><div>&nbsp;{{ object.quantity - object.instances }}</div>
                  </div>
                  <div v-show="object.store" class="flex">
                    <div class="w-20 text-left px-2" v-show="page !== 'restock'">Store: </div><div v-show="page !== 'restock'">&nbsp;{{ object.store }}</div>
                  </div>
                  <br />
                  <div class="flex">
                    <div class="w-20 text-left px-2">Uploaded: </div><div>&nbsp;{{ new Date(object.created_at).toLocaleString('en-US', {
                    month: 'numeric',
                    day:'numeric',
                    year: 'numeric'}) }}</div>
                  </div>
                  <div v-show="page === 'restock'">
                    <br />
                    <button class="btn-ui" @click="addQuantity(object.id)" v-show="object.limit === 'Unlimited' || object.quantity < object.limit">Add More</button>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "CreatorPage",
  data: () => {
    return {
      canAdmin: false,
      objects: [],
      showError: false,
      error: '',
      success: '',
      showSuccess: false,
      loaded: false,
      page: 'catalog',
      status: 1,
      title: null,
    };
  },
  methods: {
    async getResults(): Promise<void> {
      try {
        const response = await this.$http.get(`/mall/user/${this.$store.data.user.username}`);
        response.data.object.reverse().forEach(obj => {
          if(!obj.limit || obj.limit === 0){
            obj.limit = 'Unlimited';
          }
          if(this.page === 'catalog'){
            this.title = 'My Objects Catalog';
              this.$http.get(`/mall/store/${obj.id}`)
              .then(response => {
                obj.store = response.data.place[0].name;
              })
              if(obj.status !== 2){
                this.objects.push(obj)
              }  
          }
          if(this.page === 'pending'){
            this.title = 'My Pending Uploads';
            if(obj.status === 2){
              this.objects.push(obj);
            }
          }
          if(this.page === 'stocked'){
            this.title = 'My Stocked Objects';
            if(obj.status === 1){
              this.$http.get(`/mall/store/${obj.id}`)
              .then(response => {
                obj.store = response.data.place[0].name;
                this.objects.push(obj)
              })
            }
          }
          if(this.page === 'restock'){
            this.title = 'My Restockable Objects';
            if(
              obj.limit === 'Unlimited' &&
              (obj.status === 3 || obj.status === 4) ||
              obj.instances < parseInt(obj.limit) &&
              (obj.status === 3 || obj.status === 4)
              ){
                this.$http.get(`/mall/store/${obj.id}`)
              .then(response => {
                obj.store = response.data.place[0].name;
              })
              this.objects.push(obj)
            }
          }
        })
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
    changePage(page){
      if(this.page !== page){
        this.error = "";
        this.success = '';
        this.objects = [];
        this.page = page;
        this.getResults();
      }
    },
    close(){
      window.close();
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
