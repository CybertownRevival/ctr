<template>
  <div class="grid grid-cols-1 w-full place-items-center">
    <div class="text-center w-full text-5xl mb-1"></div>
    <div class="grid grid-cols-3 w-4/6 justify-items-center">
      <div class="p-5">
        Search by Username: <input type="text" style="color:black;" v-model="search">
        <button class="btn-ui-inline mx-2" @click="searchObjects">Search</button>
        <button class="btn-ui-inline" @click="clearInput">Clear</button>
      </div>
      <div></div>
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
        <th class="p-4">User Object Details</th>
        <th class="p-4">Original Object Details</th>
        <th class="p-4">Object Status</th>
        <th></th>
      </tr>
      <tr class="border" style="vertical-align: top;" v-for="object in objects"
          :key="object.id">
          <td class="p-4">{{ object.id }}</td>
          <td class="p-4">
            <table>
              <tr>
                <td class="italic">Name: </td>
                <td class="font-bold px-2 overflow-x-hidden whitespace-nowrap" style="max-width: 300px; white">{{ object.object_name }}</td>
              </tr>
              <tr>
                <td class="italic">Price: </td>
                <td class="font-bold px-2">{{ object.object_price }}</td>
              </tr>
              <tr>
                <td class="italic">Buyer: </td>
                <td class="font-bold px-2">{{ object.object_buyer }}</td>
              </tr>
            </table>
          </td>
          <td class="p-4">
            <table>
              <tr>
                <td class="italic">Mall Object ID: </td>
                <td class="font-bold px-2">{{ object.object_id }}</td>
              </tr>
              <tr>
                <td class="italic">Original Name: </td>
                <td class="font-bold px-2">{{ object.name }}</td>
              </tr>
            </table>
          </td>
          <td class="p-4">
            <table>
              <tr>
                <td class="italic">Owner: </td>
                <td class="font-bold px-2 text-green">{{ object.username }}</td>
              </tr>
              <tr>
                <td class="italic">Location: </td>
                <td class="p-4 font-bold px-2" v-if="object.place_id >= 1">{{ object.place_id }}</td>
                <td class="p-4 font-bold px-2" v-else>Owners Backpack</td>
              </tr>
            </table>
          </td>

          <td class="p-4"><button class="btn-ui">Update</button></td>
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
  name: "UserObjectSearch",
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
  props: [
    "accessLevel",
  ],
  methods: {
    async searchObjects(): Promise<any> {
      this.objects = [];
      this.pages = [];
      this.totalCount = 0;
      try {
        const searched =  await this.$http.get("/admin/object-instances/", {
            limit: this.limit,
            offset: this.offset,
            search: this.search,
          });
          this.objects = searched.data.returnResults[0].object;
          this.totalCount = searched.data.returnResults[0].total;
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
    clearInput() {
      this.search = "";
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
