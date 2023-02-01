<template>
  <div class="h-full w-full bg-black flex flex-col p-2" v-if="loaded">
    <!-- archive template: property/updatehome.tmpl -->
    <template v-if="!hasHome">
      <div class="text-center mb-3">
        <h2>You don't have a home yet.</h2>
        <p>You must first settle into a block before you can update your home.</p>
      </div>
    </template>
    <template v-else>
      <div>
        <div class="text-center mb-3">
          <h2>Update your House</h2>
          <p>Choose one of the free <strong>2D houses</strong> for the map and the <strong>3D
            house.</strong></p>
        </div>

        <p><strong>Home Name</strong>: <input maxlength="32" size="20" /> (mandatory)</p>

        <hr class="my-3" />

        <h3>Choose a free 2D House</h3>
        <input type="radio" v-model="icon2d"/>None<br />

        <template v-if="colonyData[colony.slug].map_theme === 'grass'">
          <template v-for="index in 33">
            <input type="radio" :value="index" v-model="icon2d">
            <img
              :src="'/assets/img/map_themes/grass/block/Picon2D'+
                    (index-1).toString().padStart(3,'0')+'.gif'" />
            <br />
          </template>
        </template>
        <template v-else-if="colonyData[colony.slug].map_theme === 'desert'">
          <template v-for="index in 7">
            <input type="radio" :value="index" v-model="icon2d">
            <img
              :src="'/assets/img/map_themes/desert/block/Picon2D'+
                    (index-1).toString().padStart(3,'0')+'.gif'" />
            <br />
          </template>
        </template>
        <template v-else-if="colonyData[colony.slug].map_theme === 'cyberhood'">
          <template v-for="index in 5">
            <input type="radio" :value="index" v-model="icon2d">
            <img
              :src="'/assets/img/map_themes/cyberhood/block/Picon2D'+
                    (index-1).toString().padStart(3,'0')+'.gif'" />
            <br />
          </template>
        </template>

        <hr class="my-3" />

        <h3>Your 3D House</h3>
        <p>Now it's time to choose your fabulous 3D home.
          Please check your bank account at: My Info > Personal Info >Money
          (MyInfo button on Control Panel in right frame) before deciding because
          it's really tough to get a loan around here.</p>

        <input type="radio" v-model="home3d"/>None <br />

        <template v-for="(item,key) in homeData" >
          <input type="radio" :value="key" v-model="home3d"/>
          <img :src="'/assets/img/homes/Picon3D' + key + '.gif'" />
          Price: {{ item.price }}
          <br />
        </template>

        <hr class="my-3" />

        <div class="text-center">
          <button type="button" class="btn">Update</button>
          <button type="button" class="btn" @click="$router.back()">Cancel</button>
        </div>
      </div>
    </template>
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
      hasHome: false,
      homeData: homeDataHelper,
      colonyData: colonyDataHelper,
      home: undefined,
      colony: undefined,
      icon2d: null,
      home3d: null,
    };
  },
  methods: {
    async getHome() {
      try {
        const homeResponse = await this.$http.get("/member/home");

        this.hasHome = !!homeResponse.data.homeData;
        if(this.hasHome) {
          this.home = homeResponse.data.homeData;

          const blockResponse  = await this.$http.get("/block/" + homeResponse.data.blockData.id);
          this.colony = blockResponse.data.colony;
        }
        this.loaded = true;

      } catch(e) {
        console.error(e);
      }

    },
  },
  mounted() {
    this.getHome();
  },
});
</script>
