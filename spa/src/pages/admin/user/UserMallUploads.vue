<template>
  <div>
    <div v-if="objects.length >= 1" class="grid grid-cols-3 w-full">
      <div></div>
      <div></div>
      <div>
        View Amount:
        <select v-model.number="limit" @change="setLimit">
          <option value=10>10</option>
          <option value=20>20</option>
          <option value=50>50</option>
          <option value=100>100</option>
        </select>
      </div>
    </div>
    <div v-if="objects.length >= 1" class="mt-5 grid-cols-1 w-full justify-items-center text-center ">
      Total Count: {{ totalCount }}
    </div>
    <span v-if="pages.length > 1" class="flex w-full justify-center font-bold">Pages</span>
    <div v-if="pages.length > 1" class="flex w-full justify-center font-bold">
      <span class="flex justify-center" v-for="page in pages" :value="page">
        <span class="p-2" v-if="pageNum === page">{{ page }}</span>
        <span class="p-2 cursor-pointer" style="color:lime;" v-else-if="page > (pageNum - 5) && page < (pageNum + 5)" @click="setPageNumber(page)">{{ page }}</span>
      </span>
      <span class="p-2 font-bold" style="color:lime;" v-if="(pageNum + 5) <= pages.length">. . .</span>
    </div>
    <div class="text-2xl w-full justify-center text-center p-5">Uploaded Objects</div>
    <div v-if="objects.length >= 1">
      <table>
        <tr>
          <th></th>
          <th>Mall Object Details</th>
          <th></th>
        </tr>
        <tr class="border" style="vertical-align: top;" v-for="object in objects"
          :key="object.id">
          <td>
            <img :src="'/assets/object/'+object.directory + '/' + object.image" 
                    style="max-width:200px;max-height:200px;height:auto;width:auto;"
                  />
          </td>
          <td class="p-4">
            <table>
              <tr>
                <td class="italic">ID: </td>
                <td class="font-bold px-2">{{ object.id }}</td>
              </tr>
              <tr>
                <td class="italic">Name: </td>
                <td class="font-bold px-2">{{ object.name }}</td>
              </tr>
              <tr>
                <td class="italic">Price: </td>
                <td class="font-bold px-2">{{ object.price }}</td>
              </tr>
              <tr>
                <td class="italic">Limit: </td>
                <td class="font-bold px-2" v-if="object.limit && object.limit !== '0'">1 / {{ object.limit }}</td>
                <td class="font-bold px-2" v-else>Unlimited</td>
              </tr>
              <tr>
                <td class="italic">Quantity: </td>
                <td class="font-bold px-2">{{ object.quantity }}</td>
              </tr>
              <tr>
                <td class="italic">Sold: </td>
                <td class="font-bold px-2">{{ object.instances }}</td>
              </tr>
              <tr v-if="object.store">
                <td class="italic">Store: </td>
                <td class="font-bold px-2">{{ object.store.name }}</td>
              </tr>
              <tr v-else></tr>
              <tr>
                <td class="italic">Uploaded: </td>
                <td class="font-bold px-2">{{ object.created_at }}</td>
              </tr>
              <tr>
                <td class="italic">Status: </td>
                <td class="font-bold px-2">{{ object.status }}</td>
              </tr>
            </table>
          </td>
          <td class="p-4"></td>
      </tr>
      </table>
    </div>
    <div v-else>No mall objects found.</div>
    <div class="grid grid-cols-2 w-full justify-items-center">
      <div class="p-1 text-right w-full">
        <button
            class="bg-gray-300 text-black p-2"
            @click="back"
            v-show="offset != 0">
          BACK
        </button>
      </div>
      <div class="p-1 text-left w-full">
        <button
            class="bg-gray-300 text-black p-2"
            @click="next"
            v-show="offset + limit < totalCount">
          NEXT
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  name: "UserMallUploads",
  data: () => {
    return {
      totalCount: 0,
      objects: [],
      limit: 10,
      offset: 0,
      showNext: true,
      error: null,
      pageNum: 1,
      pages: [],
      search: "",
    };
  },
  methods: {
    async searchObjects(): Promise<any> {
      this.objects = [];
      this.pages = [];
      this.totalCount = 0;
      try {
        await this.$http.get(`/mall/user/${this.$route.params.id}`, {
          limit: this.limit,
          offset: this.offset,
        }).then((res) => {
          this.objects = res.data.object.objects;
          this.totalCount = res.data.object.total[0].count;
        });
        let pages = Math.ceil(this.totalCount/this.limit);
        for(let i = 1; pages >= i; i++){
          this.pages.push(i);
        }
        if(this.pageNum > pages && this.totalCount > 0){
          this.pageNum = 1;
          this.offset = 0;
          setTimeout(this.searchObjects, 1000);
        }
      } catch (error) {
        console.log(error);
      }
    },
    setLimit(){
      this.offset = 0;
      this.pageNum = 1;
      this.searchObjects();
    },
    setPageNumber(value){
      this.pageNum = value;
      this.offset = this.pageNum * this.limit - this.limit;
      this.searchObjects();
    },
    async next() {
      this.offset = this.pageNum * this.limit;
      this.pageNum++
      await this.searchObjects();
    },
    async back() {
      this.pageNum--
      this.offset = this.pageNum * this.limit - this.limit;
      await this.searchObjects();
      this.showNext = true;
    },
  },
  async created() {
    await this.searchObjects();
  },
  mounted() {
  },
});
</script>
