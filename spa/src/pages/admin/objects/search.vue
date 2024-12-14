<template>
  <div class="grid grid-cols-1 w-full place-items-center">
    <div class="text-center w-full text-5xl mb-1">Objects</div>
    <div class="grid grid-cols-2 w-4/6 justify-items-center">
      <div>
        Catagory:
        <select v-model.number="status" @change="searchObjects">
          <option value=9>All Objects</option>
          <option value=3>Approved Objects</option>
          <option value=1>Stocked Objects</option>
          <option value=2>Pending Objects</option>
          <option value=4>Destocked Objects</option>
          <option value=0>Rejected Objects</option>
        </select>
      </div>
      <div>
        View Amount:
        <select v-model.number="limit" @change="setLimit">
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>
    </div>
    <div class="grid-cols-1 w-4/6 justify-items-center text-center ">
      Total Count: {{ totalCount }}
    </div>
    <div class="flex w-full">
      <span class="pl-5" style="width: 150px;">Search by name</span>
      <input class="text-black" v-model="search" @input="searchObjects" type='text' />
    </div>
    <span v-if="pages.length > 1">Pages</span>
    <div v-if="pages.length > 1" class="flex w-full justify-center font-bold">
      <span class="flex justify-center" v-for="page in pages" :value="page">
        <span class="p-2" v-if="pageNum === page">{{ page }}</span>
        <span class="p-2 cursor-pointer" style="color:lime;" v-else-if="page > (pageNum - 5) && page < (pageNum + 5)" @click="setPageNumber(page)">{{ page }}</span>
      </span>
      <span class="p-2 font-bold" style="color:lime;" v-if="(pageNum + 5) <= pages.length">. . .</span>
    </div>
    <table class="table-auto border-collapse">
      <tr>
        <th class="p-4">ID</th>
        <th class="p-4">Name</th>
        <th class="p-4">Directory</th>
        <th class="p-4">Filename</th>
        <th class="p-4">Thumbnail</th>
        <th class="p-4">Texture</th>
        <th class="p-4">Creator</th>
        <th class="p-4">Price</th>
        <th class="p-4">Limit</th>
        <th class="p-4">Quantity</th>
        <th class="p-4">Status</th>
        <th class="p-4"></th>
      </tr>
      <tr class="border" v-for="object in objects"
          :key="object.id">
          <td class="p-4">{{ object.id }}</td>
          <td class="p-4">{{ object.name }}</td>
          <td class="p-4">{{ object.directory }}</td>
          <td class="p-4">{{ object.filename }}</td>
          <td class="p-4">{{ object.image }}</td>
          <td class="p-4">{{ object.texture }}</td>
          <td class="p-4">{{ object.username }}</td>
          <td class="p-4">{{ object.price }}</td>
          <td class="p-4">{{ object.limit }}</td>
          <td class="p-4">{{ object.quantity }}</td>
          <td class="p-4">{{ objectState[object.status] }}</td>
          <td class="p-4"><button class="btn-ui">Edit Object</button></td>
      </tr>
    </table>
    <div class="flex w-full justify-center">
      <div class="flex justify-center">
        <div class="p-1 text-right w-full" v-if="pageNum > 1">
          <button class="btn" @click="back">
            BACK
          </button>
        </div>
        <div class="p-1 w-full" v-if="totalCount - offset > limit">
          <button class="btn" @click="next">
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
  name: "ObjectSearch",
  data: () => {
    return {
      totalCount: 0,
      objects: [],
      status: 9,
      limit: 10,
      offset: 0,
      showNext: true,
      error: null,
      pageNum: 1,
      pages: [],
      column: 'status',
      compare: '=',
      objectState: ['Rejected', 'Stocked', 'Pending', 'Approved', 'Destocked'],
      search: "",
      searchStatus: null,
      searchCompare: null,
    };
  },
  props: [
    "accessLevel",
  ],
  methods: {
    async searchObjects(): Promise<any> {
      this.objects = [];
      this.pages = [];
      if(this.status === 9){
        this.searchStatus = 0;
        this.searchCompare = '>=';
      } else {
        this.searchStatus = this.status;
        this.searchCompare = this.compare;
      }
      try {
        const searched =  await this.$http.get("/mall/allobjectsearch/", {
            limit: this.limit,
            offset: this.offset,
            search: this.search,
            compare: this.searchCompare,
            status: this.searchStatus
          });
          this.objects = searched.data.results.objects;
          this.totalCount = searched.data.results.total[0].count;
          let pages = Math.ceil(this.totalCount/this.limit);
          for(let i = 1; pages >= i; i++){
            this.pages.push(i);
          }
          if(this.pageNum > pages){
            this.pageNum = 1;
            this.offset = 0;
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
});
</script>
