<template>
  <div class='flex-1 justify-center text-center w-full'>
    <div class="flex w-48 p-5" v-if="page !== 'search'">
      <button class="btn-ui justify-self-start" @click="backToSearch()">Back</button>
    </div>
    <div class='text-5xl p-5' v-if="page === 'search'">Mall Object Catalog</div>
    <div class='flex-1 justify-center text-center w-full' v-if="page === 'search'">
      <div class="grid grid-cols-3 w-full justify-items-center">
        <div v-if="total !== 0">
        </div>
        <div v-if="total !== 0">
          Total Count: {{ total }}
        </div>
        <div v-if="total !== 0">
          View Amount:
          <select v-model.number="limit" @change="setLimit">
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>
      <div v-if="pages.length > 1" class="flex w-full justify-center font-bold">
        <span class="flex justify-center" v-for="page in pages" :value="page">
          <span class="p-2" v-if="pageNum === page">{{ page }}</span>
          <span class="p-2 cursor-pointer" style="color:lime;" v-else-if="page > (pageNum - 5) && page < (pageNum + 5)" @click="setPageNumber(page)">{{ page }}</span>
        </span>
        <span class="p-2 font-bold" style="color:lime;" v-if="(pageNum + 5) <= pages.length">. . .</span>
      </div>
      <ul class="flex flex-wrap w-full gap-5 px-5 cursor-pointer">
        <li v-for="object in objects" :key="object.id" 
        @click="showDetails(object)" 
        class="flex-1 border-2 rounded-lg overflow-hidden" 
        style="min-width: 240px; max-width: 240px; border-color: #222;">
          <span class="flex w-full p-2 font-bold text-lg" style="background-color: #111;">
            <span class="w-full text-left">{{ formatName(object.name) }}</span>
            <span v-if="object.instances === 0 && object.status === 3" class="relative text-sm text-green right-auto">Coming<br />Soon!</span>
          </span>
          <div class="flex w-full items-center justify-center" style="height: 210px;">
            <img :src="`/assets/object/${object.directory}/${object.image}`"
            style="max-width: 190px; max-height: 190px; width:auto; height:auto;">
          </div>
          <div>
            <div class="w-full p-2 text-right">by {{ object.username }}</div>
          </div>
        </li>
      </ul>
      <div class="flex w-full justify-center py-5">
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
    <div class="px-5" v-else>
      <div class="flex border-2 w-7/8" style="border-color: #222;">
        <div class="flex-1 w-full justify-center p-5 border" style="border-color: #222;">
          <img :src="`/assets/object/${objectDirectory}/${objectImage}`"
          style="max-width: 450px; max-height: 450px;" />
        </div>
        <div class="flex-1 w-full justify-center p-5 border" style="background-color: #000; border-color: #222;">
          <div class="text-2xl p-5">Object Details</div>
          <div class="grid pb-2" style="grid-template-columns: 85px auto;">
            <div class="text-right pr-5" style="background-color: #111;">Name: </div>
            <div class="text-left" style="background-color: #111;">{{ name }}</div>
          </div>
          <div class="grid pb-2" style="grid-template-columns: 85px auto;">
            <div class="text-right pr-5" style="background-color: #111;">Creator: </div>
            <div class="text-left" style="background-color: #111;">{{ creator }}</div>
          </div>
          <div class="grid pb-2" style="grid-template-columns: 85px auto;">
            <div class="text-right pr-5" style="background-color: #111;">Mall Price: </div>
            <div class="text-left" style="background-color: #111;">{{ price }} cc</div>
          </div>
          <div class="grid pb-2" style="grid-template-columns: 85px auto;">
            <div class="text-right pr-5" style="background-color: #111;">Limit: </div>
            <div class="text-left" style="background-color: #111;">{{ objectLimit }}</div>
          </div>
          <div class="grid pb-2" style="grid-template-columns: 85px auto;">
            <div class="text-right pr-5" style="background-color: #111;">Qty Sold: </div>
            <div class="text-left" style="background-color: #111;">{{ qtySold }}</div>
          </div>
          <div class="grid pb-2" style="grid-template-columns: 85px auto;">
            <div class="text-right pr-5" style="background-color: #111;">Uploaded: </div>
            <div class="text-left" style="background-color: #111;">{{ uploadDate }}</div>
          </div>
          <div>
            <div class="text-2xl p-5 text-green">Looking for this item?</div>
            <div class="grid grid-cols-2 border">
              <div class="px-2 text-right">In public areas:</div>
              <div>{{ publicPlaces }}</div>
              <div class="px-2 text-right">Quantity for sale:</div>
              <div>{{ forSale }}</div>
            </div>
            <div class="text-normal p-5">Be sure to check the <span class="text-green font-bold">Flea Market</span> and the <span class="text-green font-bold">Black Market</span> !
              <br /><br />
              <span v-if="displayOffer">If you're unable to find any, try making an offer.</span>
            </div>
            <div class="pb-5" v-if="displayOffer">
              <button class="btn-ui" @click="makeOffer()">Make Offer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang=ts>
import Vue from "vue";

export default Vue.extend({
  name: "ObjectCatalog",
  data: () => {
    return {
      page: 'search',
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
      object_id: 0,
      objectName: null,
      objectDirectory: null,
      objectImage: null,
      creator: null,
      name: null,
      price: 0,
      objectLimit: '',
      qtySold: 0,
      uploadDate: null,
      forSale: 0,
      publicPlaces: 0,
      displayOffer: false,
    };
  },
  methods: {
    async getObjects(): Promise<void> {
      this.objects = [];
      this.pages = [];
      try {
        const object = await this.$http.get(`/mall/object-catalog`, {
          limit: this.limit,
          offset: this.offset,
        });
        this.objects = object.data.results.objects;
        this.total = object.data.results.total[0].count;
        this.showSuccess = true;
        let pages = Math.ceil(this.total/this.limit);
        for(let i = 1; pages >= i; i++){
          this.pages.push(i);
        }
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
    formatName(name) {
      const formattedName = name.split('(');
      return formattedName[0];
    },
    formatDate(date){
      return new Date(date)
        .toLocaleString('en-US', {
          month: 'numeric',
          day:'numeric',
          year: 'numeric'
        })
    },
    async showDetails(object) {
      const index = this.objects.indexOf(object);
      const details = this.objects[index];
      this.object_id = details.id;
      this.forSale = details.forSale;
      this.publicPlaces = details.publicPlaces;
      this.objectName = details.name;
      this.objectDirectory = details.directory;
      this.objectImage = details.image;
      this.name = details.name;
      this.price = details.price;
      this.creator = details.username;
      if(details.limit && details.limit >= 1){
        this.objectLimit ="1/"+details.limit;
      } else {
        this.objectLimit = 'Unlimited';
      }
      this.qtySold = details.instances;
      this.uploadDate = this.formatDate(details.created_at);
      this.page = 'details';
    },
    backToSearch() {
      this.object_id = 0;
      this.objectName = null;
      this.objectDirectory = null;
      this.objectImage = null;
      this.name = null;
      this.price = 0;
      this.creator = null;
      this.objectLimit = '';
      this.qtySold = 0;
      this.uploadDate = null;
      this.page = 'search';
    },
    async setLimit(){
      this.offset = 0;
      this.pageNum = 1;
      await this.getObjects();
    },
    async setPageNumber(value){
      this.pageNum = value;
      this.offset = this.pageNum * this.limit - this.limit;
      await this.getObjects();
    },
    async next() {
      this.offset = this.pageNum * this.limit;
      this.pageNum++
      await this.getObjects();
    },
    async back() {
      this.pageNum--
      this.offset = this.pageNum * this.limit - this.limit;
      await this.getObjects();
      this.showNext = true;
    },
    async makeOffer(){
      // Add functionality to make an offer.
      // Hid button until functionality is added.
    }
  },
  created() {
    this.getObjects();
  },
});
</script>
