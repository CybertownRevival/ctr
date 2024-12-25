<template>
	<div class="w-full flex">
    <div class="flex flex-col w-full place-items-center">
    <div class="text-red-500" v-show="error">{{ error }}</div>
    <div class="text-center w-full text-5xl mb-1">My Pending Objects</div>
    <div class="grid grid-cols-2 w-4/6 justify-items-center">
      <div v-if="total !== 0">
      </div>
      <div v-if="total !== 0">
        View Amount:
        <select v-model.number="limit" @change="setLimit">
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>
    </div>
    <br />
    <div v-if="total !== 0" class="grid-cols-1 w-4/6 justify-items-center text-center ">
      Total Count: {{ total }}
    </div>
    <span v-if="pages.length > 1">Pages</span>
    <div v-if="pages.length > 1" class="flex w-full justify-center font-bold">
      <span class="flex justify-center" v-for="page in pages" :value="page">
        <span class="p-2" v-if="pageNum === page">{{ page }}</span>
        <span class="p-2 cursor-pointer" style="color:lime;" v-else-if="page > (pageNum - 5) && page < (pageNum + 5)" @click="setPageNumber(page)">{{ page }}</span>
      </span>
      <span class="p-2 font-bold" style="color:lime;" v-if="(pageNum + 5) <= pages.length">. . .</span>
    </div>
    <div v-if="total === 0">No items to show</div>
    <div v-else>
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
          </div>
        </div>
      </div>
    </div>
    <div class="flex w-full justify-center">
      <div class="flex justify-center">
        <div class="p-1 text-right w-full" v-if="pageNum > 1">
          <button class="btn" @click="back">
            BACK
          </button>
        </div>
        <div class="p-1 w-full" v-if="total - offset > limit">
          <button class="btn" @click="next">
            NEXT
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "CreatorPending",
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
      limit: 10,
      offset: 0,
      showNext: true,
      pageNum: 1,
      pages: [],
    };
  },
  methods: {
    setLimit(){
      this.offset = 0;
      this.pageNum = 1;
      this.getResults();
    },
    setPageNumber(value){
      this.pageNum = value;
      this.offset = this.pageNum * this.limit - this.limit;
      this.getResults();
    },
    async getResults(): Promise<void> {
      this.objects = [];
      this.pages = [];
      try {
        const response = await this.$http.post(`/mall/user`, {
          username: this.$store.data.user.username,
          compare: 0,
          status: 2,
          limit: this.limit,
          offset: this.offset,
        });
        this.objects = response.data.object.objects;
        this.total = response.data.object.total[0].count;
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
    async next() {
      this.offset = this.pageNum * this.limit;
      this.pageNum++
      await this.getResults();
    },
    async back() {
      this.pageNum--
      this.offset = this.pageNum * this.limit - this.limit;
      await this.getResults();
      this.showNext = true;
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
