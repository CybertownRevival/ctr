<template>
  <div class="h-full w-full bg-black flex flex-col p-2" v-if="loaded">
    <!-- archive template: property/updatehome.tmpl -->
    <div v-if="!complete">
      <template v-if="!hasHome">
        <div class="text-center mb-3">
          <h2>You don't have a home yet.</h2>
          <p>You must first settle into a block before you can update your home.</p>
        </div>
      </template>
      <template v-else>
        <div>
          <div class="text-center mb-3">
            <h2 class="font-bold text-green">Update your House</h2>
            <p>Choose one of the free <strong>2D houses</strong> for the map and the <strong>3D
              house.</strong></p>
            <p class="mb-5">
              <strong>Note:</strong>
              <em>Use the button at the bottom to submit the form.</em>
            </p>

            <p><strong>Home Name</strong>: <input
              type="text"
              maxlength="32"
              size="20"
              class="input-text"
              v-model="homeName"
            /> (mandatory)</p>
          </div>


          <hr class="my-5" />
          <h3 class="font-bold mb-3">Choose a free 2D House</h3>

          <div class="grid grid-cols-3 gap-4">
            <template v-if="colonyData[colony.slug].map_theme === 'grass'">
              <template v-for="index in 33">
                <div>
                  <input type="radio" :value="index" v-model="icon2d" class="mr-3">
                  <img
                    :src="'/assets/img/map_themes/grass/block/Picon2D'+
                    (index-1).toString().padStart(3,'0')+'.gif'" />
                </div>
              </template>
            </template>
            <template v-else-if="colonyData[colony.slug].map_theme === 'desert'">
              <template v-for="index in 7">
                <div>
                  <input type="radio" :value="index" v-model="icon2d" class="mr-3">
                  <img
                    :src="'/assets/img/map_themes/desert/block/Picon2D'+
                    (index-1).toString().padStart(3,'0')+'.gif'" />
                </div>
              </template>
            </template>
            <template v-else-if="colonyData[colony.slug].map_theme === 'cyberhood'">
              <template v-for="index in 5">
                <div>
                  <input type="radio" :value="index" v-model="icon2d" class="mr-3">
                  <img
                    :src="'/assets/img/map_themes/cyberhood/block/Picon2D'+
                    (index-1).toString().padStart(3,'0')+'.gif'" />
                </div>
              </template>
            </template>
          </div>

          <hr class="my-5" />

          <h3 class="font-bold mb-3">Your 3D House</h3>

          <p class="mb-3">Now it's time to choose your fabulous 3D home.
            Please check your bank account at: My Info > Personal Info > Money
            (MyInfo button on Control Panel in right frame) before deciding because
            it's really tough to get a loan around here.</p>


          <div class="grid grid-cols-2 gap-5">
            <div>
              <input type="radio" v-model="home3d" class="mr-3"/>None
            </div>
            <div></div>

            <template v-for="(item,key) in homeData" >
              <div>
                <input type="radio" :value="key" v-model="home3d" class="mr-3"/>
                <img :src="'/assets/img/homes/Picon3D' + key + '.gif'" /><br />
                Price: <strong>{{ item.price }}cc</strong>
                <span v-show="key==='championhome' && donorLevel==='Champion'">
                  <br />Thank you for your donation!
                </span>
              </div>
            </template>
          </div>


          <div v-if="showError" class="text-center text-red-500">{{ error }}</div>

          <div class="text-center">
            <button type="button" class="btn" @click="update">Update</button>
            <button type="button" class="btn" @click="$router.back()">Cancel</button>
          </div>
        </div>
      </template>
    </div>
    <div v-if="complete">
      <p class="text-center">
        Your home has been updated.
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import {colonyDataHelper, homeDataHelper} from "@/helpers";

export default Vue.extend({
  name: "HomeUpdateHomePage",
  data: () => {
    return {
      loaded: false,
      showError: false,
      error: "",
      complete: false,
      hasHome: false,
      homeData: homeDataHelper,
      colonyData: colonyDataHelper,
      home: undefined,
      colony: undefined,
      icon2d: null,
      home3d: null,
      homeName: "",
      donorLevel: undefined,
    };
  },
  methods: {
    async getHome() {
      try {
        const homeResponse = await this.$http.get("/home");
        await this.$http.get("/member/getdonorlevel")
          .then((response) => {
            this.donorLevel = response.data.name;
          });
        
        if(this.donorLevel === "Champion"){
          this.homeData.championhome.price = 0;
        }

        this.hasHome = !!homeResponse.data.homeData;
        if(this.hasHome) {
          this.home = homeResponse.data.homeData;
          if(homeResponse.data.homeDesignData) {
            this.home3d = homeResponse.data.homeDesignData.id;
          }
          this.icon2d = this.home.map_icon_index;
          this.homeName = this.home.name;
          const blockResponse  = await this.$http.get(`/block/${  homeResponse.data.blockData.id}`);
          this.colony = blockResponse.data.colony;
        }
        this.loaded = true;

      } catch(e) {
        console.error(e);
      }

    },

    async update() {
      this.showError = false;
      this.error = "";

      try {
        await this.$http.post("/home/update", {
          homeName: this.homeName,
          icon2d: this.icon2d,
          home3d: this.home3d,
        });

        this.complete = true;

      } catch(e) {
        this.error = e.response.data.error;
        this.showError = true;
      }

    },
  },
  mounted() {
    this.getHome();
  },
});
</script>
