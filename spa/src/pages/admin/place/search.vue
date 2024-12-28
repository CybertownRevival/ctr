<template>
  <div class="grid grid-cols-1 w-full place-items-center">
    <div class="text-center w-full text-5xl mb-1">Places</div>
    <div class="grid grid-cols-2 w-4/6 justify-items-center">
      <div>
        Catagory:
        <select v-model="type" @change="getResults">
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
      <div>
        View Amount:
        <select v-model.number="limit" @change="getResults">
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
    <table class="table-auto border-collapse">
      <tr>
        <th class="p-4">ID</th>
        <th class="p-4">Name</th>
        <th class="p-4">Description</th>
        <th v-show="type !== 'home'" class="p-4">Slug</th>
        <th v-show="type === 'home' || type === 'club'" class="p-4">Owner</th>
        <th v-show="type === 'shop'" class="p-4">Status</th>
        <th v-show="type !== 'block'">Objects</th>
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
        <td v-if="place.objects === 0" class="p-4 text-center">{{ place.objects }}</td>
        <td v-else class="p-4 text-center" style="color: yellow; font-weight: bold;">{{ place.objects }}</td>
        <td class="p-4" v-if="accessLevel.includes('security') || ['colony', 'hood', 'block', 'home'].includes(type)">
          <button class="btn-ui" @click="updateName(place.id, place.name)">Edit Name</button>
          <button class="btn-ui" @click="updateDesc(place.id, place.description)">Edit Desc</button>
          <br v-show="type === 'shop'" />
          <button v-show="type === 'shop' && place.status === 1" class="btn-ui" @click="updateStatus(place.id, place.status)">Disable</button>
          <button v-show="type === 'shop' && place.status === 0" class="btn-ui" @click="updateStatus(place.id, place.status)">Enable</button>
        </td>
        <td v-else></td>
      </tr>
    </table>
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
                v-show="offset + limit <= totalCount">
          NEXT
        </button>
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
      showNext: true,
      error: null,
      status: ['Disabled','Active'],
    };
  },
  props: [
    "accessLevel",
  ],
  methods: {
    async getResults(): Promise<any> {
      try {
        return this.$http.get(
          "/admin/places", {
          limit: this.limit,
          offset: this.offset,
          type: this.type,
        },
        ).then((response) => {
          this.places = response.data.results.places;
          if(this.type === 'home' || this.type === 'club'){
            this.places.forEach (place => {
              this.$http.get(`/member/info/${place.member_id}`)
              .then(result => {
                place.username = result.data.memberInfo.username;
                this.places.splice(place, this.places.indexOf(place.id));
              });
            })
          }
          if(this.type !== 'block'){
            if(this.type === 'shop'){
              this.places.forEach (place => {
                this.$http.get(`/mall/objects/${place.id}`)
                .then(result => {
                  place.objects = result.data.objects.length;
                  this.places.splice(place, this.places.indexOf[place.id]);
                })
              })
            } else {
              this.places.forEach (place => {
                this.$http.get(`/place/${place.id}/object_instance`)
                .then(result => {
                  place.objects = result.data.object_instance.length;
                  this.places.splice(place, this.places.indexOf[place.id]);
                })
              })
            }
          }
          this.totalCount = response.data.results.total[0].count;
        });
      } catch (error) {
        this.error = error;
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
            this.getResults();
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
            this.getResults();
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
            this.getResults();
          }
        })
      } catch(error){
        console.log(error);
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
  async created() {
    await this.getResults();
  },
});
</script>
