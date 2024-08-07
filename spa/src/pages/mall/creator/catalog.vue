<template>
	<div class="w-full flex">
    <div class="flex flex-col w-full place-items-center">
    <div class="text-red-500" v-show="error">{{ error }}</div>
    <div class="text-center w-full text-5xl mb-1">My Upload Catalog</div>
    <div class="grid grid-cols-2 w-4/6 justify-items-center">
      <div>
      </div>
      <div v-show="total > 10">
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
          <div class="flex"><div class="w-24">Sold: </div><div>{{ object.instances }}</div></div>
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
                v-show="total - offset >= limit">
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
      limit: 10,
      offset: 0,
      showNext: true,
    };
  },
  methods: {
    async getResults(): Promise<void> {
      this.objects = [];
      try {
        const response = await this.$http.post(`/mall/user`, {
          username: this.$store.data.user.username,
          compare: 4,
          status: 1,
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
    this.getResults();
  },
  watch: {
  },
});
</script>
