<template>
  <div class="grid grid-cols-1 w-full place-items-center">
    <div class="text-center w-full text-5xl mb-1"></div>
    <div class="grid grid-cols-3 w-4/6 justify-items-center">
      <div>
        <h3>Catagory</h3>
        <select v-model="type" @change="searchPlaces">
          <option v-if="accessLevel.includes('admin')" value="public">Public Places</option>
          <option v-if="accessLevel.includes('admin')" value="shop">Mall Stores</option>
          <option value="colony">Colonies</option>
          <option value="hood">Neighborhoods</option>
          <option value="block">Blocks</option>
          <option value="home">Homes</option>
          <option value="club">Clubs</option>
          <option v-if="accessLevel.includes('security')" value="private">Private Places</option>
        </select>
      </div>
      <div class="flex flex-col items-center">
        <h3>Search Places by Name</h3>
        <input class="text-black" v-model="search" @input="searchPlaces" type='text' />
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
        <th class="p-4">Name</th>
        <th class="p-4">Description</th>
        <th v-show="type !== 'home'" class="p-4">Slug</th>
        <th v-show="type === 'home' || type === 'club'" class="p-4">Owner</th>
        <th v-show="type === 'shop'" class="p-4">Status</th>
        <th class="p-4"></th>
      </tr>
      <tr class="border" v-for="place in places"
          :key="place.id">
        <td class="p-4">{{ place.id }}</td>
        <td class="p-4">{{ place.name }}</td>
        <td class="p-4">{{ place.description }}</td>
        <td v-show="type !== 'home'" class="p-4">{{ place.slug }}</td>
        <td v-show="type === 'home' || type === 'club'" class="p-4">{{ place.username }}</td>
        <td v-show="type === 'shop' && place.status === 1" class="p-4" style="color: limegreen; font-weight: bold;">{{ status[place.status] }}</td>
        <td v-show="type === 'shop' && place.status === 0" class="p-4" style="color: gray;"><i>{{ status[place.status] }}</i></td>
        <td class="p-4" v-if="accessLevel.includes('security') && ['home'].includes(type) || accessLevel.includes('admin')">
          <button class="btn-ui" @click="updateName(place.id, place.name)">Edit Name</button>
          <button class="btn-ui" @click="updateDesc(place.id, place.description)">Edit Desc</button>
          <br v-show="type === 'shop'" />
          <button v-show="type === 'shop' && place.status === 1" class="btn-ui" @click="updateStatus(place.id, place.status)">Disable</button>
          <button v-show="type === 'shop' && place.status === 0" class="btn-ui" @click="updateStatus(place.id, place.status)">Enable</button>
        </td>
        <td v-else></td>
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
  name: "PlaceSearch",
  data: () => {
    return {
      totalCount: 0,
      places: [],
      type: 'colony',
      limit: 10,
      offset: 0,
      pageNum: 1,
      pages: [],
      compare: '=',
      search: '',
      showNext: true,
      error: null,
      status: ['Disabled','Active'],
    };
  },
  props: [
    "accessLevel",
  ],
  methods: {
    async searchPlaces(): Promise<any> {
      this.places = [];
      this.pages = [];
      try {
        const searched =  await this.$http.get("/admin/allplacessearch/", {
            limit: this.limit,
            offset: this.offset,
            search: this.search,
            compare: this.compare,
            type: this.type
          });
          this.places = searched.data.results.places;
          this.totalCount = searched.data.results.total[0].count;
          let pages = Math.ceil(this.totalCount/this.limit);
          for(let i = 1; pages >= i; i++){
            this.pages.push(i);
          }
          if(this.pageNum > pages && this.totalCount > 0){
            this.pageNum = 1;
            this.offset = 0;
            setTimeout(this.searchPlaces, 1000);
          }
      } catch (error) {
        console.log(error);
      }
    },
    async updateStatus(id, state){
      let updateStatus;
      if(state === 0){
        updateStatus = 1;
      } else {
        updateStatus = 0;
      }
      try{
        await this.$http.post("/admin/places/update/", {
          id: id,
          column: 'status',
          content: updateStatus
        }).then(response => {
          if(response.data.status === 'success'){
            this.searchPlaces();
          }
        })
      } catch(error){
        console.log(error);
      }
    },
    async updateName(id, name){
      let newName = prompt("Current Name:\n " + name + "\n\nNew Name:", name);
      if(newName !== null && newName !==''){
        try{
        await this.$http.post("/admin/places/update/", {
          id: id,
          column: 'name',
          content: newName
        }).then(response => {
          if(response.data.status === 'success'){
            this.searchPlaces();
          }
        })
      } catch(error){
        console.log(error);
      }
      }
    },
    async updateDesc(id, desc){
      let newDesc = prompt("Current Description:\n " + desc + "\n\nNew Description:", desc);
      if(newDesc !== null && newDesc !==''){
        try{
        await this.$http.post("/admin/places/update/", {
          id: id,
          column: 'description',
          content: newDesc
        }).then(response => {
          if(response.data.status === 'success'){
            this.searchPlaces();
          }
        })
      } catch(error){
        console.log(error);
      }
      }
    },
    setLimit(){
      this.offset = 0;
      this.pageNum = 1;
      this.searchPlaces();
    },
    setPageNumber(value){
      this.pageNum = value;
      this.offset = this.pageNum * this.limit - this.limit;
      this.searchPlaces();
    },
    async next() {
      this.offset = this.pageNum * this.limit;
      this.pageNum++
      await this.searchPlaces();
    },
    async back() {
      this.pageNum--
      this.offset = this.pageNum * this.limit - this.limit;
      await this.searchPlaces();
      this.showNext = true;
    },
  },
  async created() {
    await this.searchPlaces();
  },
});
</script>