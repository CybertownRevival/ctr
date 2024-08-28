<template>
	<div class="w-full flex">
    <div class="flex flex-col w-full place-items-center">
    <div class="text-red-500" v-show="error">{{ error }}</div>
    <div class="text-center w-full text-5xl mb-1">Sold Out Objects</div>
    <br />
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
          <div class="flex" v-if="object.limit"><div class="w-24">Limit: </div><div>{{ object.limit }}</div></div>
          <div class="flex" v-else><div class="w-24">Limit: </div><div>Unlimited</div></div>
          <div class="flex"><div class="w-24">Created By: </div><div>{{ object.username }}</div></div>
          <div class="flex"><div class="w-24">Located In: </div>{{ object.store.name }}</div>
        </div>
        <div>
          <button class="btn-ui" @click="remove(object.id)">Remove</button>
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
  name: "MallSoldOut",
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
      content: 1,
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
        const response = await this.$http.get('/mall/soldout');
        response.data.objects.objects.forEach((obj) => {
          if(obj.instances === obj.quantity && (obj.limit === obj.quantity || ['0', 'Unlimited', null].includes(obj.limit))){
            this.objects.push(obj);
          }
        });
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
    async remove(objectId): Promise<void> {
      this.showSuccess = false;
      this.showError = false;
      try {
        this.error = '';
        this.showError = false;
        await this.$http.post("/mall/remove", {
        'objectId': objectId,
        });
        this.success = 'Object removed from store.';
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
    this.getResults();  
  },
});
</script>
