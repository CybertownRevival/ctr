<template>
  <div class="grid grid-cols-1 w-full place-items-center">
    <div class="text-center w-full text-5xl mb-1"></div>
    <div class="grid grid-cols-3 w-4/6 justify-items-center">
      <div>
        <h3>Object Status</h3>
        <select v-model.number="status" @change="searchObjects">
          <option value=9>All Objects</option>
          <option value=3>Approved Objects</option>
          <option value=1>Stocked Objects</option>
          <option value=2>Pending Objects</option>
          <option value=4>Destocked Objects</option>
          <option value=0>Rejected Objects</option>
        </select>
      </div>
      <div class="flex flex-col items-center">
        <h3>Search Objects by Name</h3>
        <input class="text-black" v-model="search" @input="searchObjects" type='text' />
      </div>
      <div>
        <h3>View Amount</h3>
        <select v-model.number="limit" @change="setLimit">
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>
    </div>
    <div class="mt-5 grid-cols-1 w-4/6 justify-items-center text-center ">
      Total Count: {{ totalCount }}
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
        <th class="p-4">Object Name</th>
        <th class="p-4">File Details</th>
        <th class="p-4">Uploaded By</th>
        <th class="p-4">Statistics</th>
        <th class="p-4">Status</th>
        <th class="p-4"></th>
      </tr>
      <tr class="border" style="vertical-align: top;" v-for="object in objects"
          :key="object.id">
          <td class="p-5">{{ object.id }}</td>
          <td class="p-5" style="color:lime;">{{ object.name }}</td>
          <td class="p-4">
            <div class="grid" style="grid-template-columns: 100px auto;">
              <span class="p-1 text-right italic">Directory: </span>
              <span class="p-1 font-bold">{{ object.directory }}</span>
            </div>
            <div class="grid" style="grid-template-columns: 100px auto;">
              <span class="p-1 text-right italic">Filename: </span>
              <span class="p-1 font-bold">{{ object.filename }}</span>
            </div>
            <div class="grid" style="grid-template-columns: 100px auto;">
              <span class="p-1 text-right italic">Thumbnail: </span>
              <span class="p-1 font-bold">{{ object.image }}</span>
            </div>
            <div class="grid" style="grid-template-columns: 100px auto;">
              <span class="p-1 text-right italic">Texture: </span>
              <span class="p-1 font-bold">{{ object.texture }}</span>
            </div>
          </td>
          <td class="p-5" style="color:lime;">{{ object.username }}</td>
          <td class="p-4">
            <div class="grid grid-cols-2">
              <span class="p-1 text-right italic">Price: </span>
              <span class="p-1 font-bold">{{ object.price }}</span>
            </div>
            <div class="grid grid-cols-2">
              <span class="p-1 text-right italic">Limit: </span>
              <span class="p-1 font-bold" v-if="object.limit">1/{{ object.limit }}</span>
              <span class="p-1 font-bold" v-else>Unlimited</span>
            </div>
            <div class="grid grid-cols-2">
              <span class="p-1 text-right italic">Quantity: </span>
              <span class="p-1 font-bold">{{ object.quantity }}</span>
            </div>
            <div class="grid grid-cols-2">
              <span class="p-1 text-right italic">Sold: </span>
              <span class="p-1 font-bold">{{ object.instances }}</span>
            </div>
          </td>
          <td class="p-5 font-bold" style="color:lime;">{{ objectState[object.status] }}</td>
          <td class="p-5"><button class="btn-ui p-2" @click="openUpdater(object.id)">Update<br />Object</button></td>
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
          if(this.pageNum > pages && this.totalCount > 0){
            this.pageNum = 1;
            this.offset = 0;
            setTimeout(this.searchObjects, 1000);
          }
      } catch (error) {
        console.log(error);
      }
    },
    openUpdater(objectId){
      window.open("/#/admin/update-object/" + objectId, "targetWindow", "width=1000px,height=700px,location=0,menubar=0,status=0,scrollbars=0");
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