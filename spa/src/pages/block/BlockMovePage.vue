<template>
  <div v-if="loaded">

    <div v-if="!complete">
      <div v-if="relocating">
        <!-- RELOCATE MESSAGE -->
        <p><strong>Hello {{ $store.data.user.username }},</strong> do you want to move from
          '{{ homeResponse.blockData.name }}' to
          this plot?
        </p>
        <button type="button" class="btn" @click="relocate">Yes</button>
        <button type="button" class="btn" @click="$router.back()">No</button>
      </div>
      <div v-else-if="relocating === false">
        <!-- SETTLE MESSAGE -->
        <div class="text-center">
          <h2 class="font-bold text-green">Settle down here!</h2>
          <p>Choose one of the free 2D houses and the 3D house.</p>
          <p class="mb-5">
            <strong>Note:</strong>
            <em>Use the button at the bottom to submit the form.</em>
          </p>
        </div>
        <table>

          <tr>
            <td><strong>House Name</strong></td>
            <td><input maxlength="32" size="20" v-model="houseName"/> (mandatory)</td>
          </tr>

          <tr>
            <td><strong>House Description</strong></td>
            <td><input maxlength="255" size="32" v-model="houseDescription"/></td>
          </tr>

          <tr>
            <td><strong>Your First Name</strong></td>
            <td><input maxlength="20" size="20" v-model="firstName"/></td>
          </tr>

          <tr>
            <td><strong>Your Last Name</strong></td>
            <td><input maxlength="32" size="32" v-model="lastName"/></td>
          </tr>

        </table>

        <hr class="my-5" />
        <h3 class="font-bold mb-3">Choose a free 2D House</h3>
        <div class="grid grid-cols-3 gap-4">
          <template v-if="colonyData[colony.slug].map_theme === 'grass'">
            <template v-for="index in 33">
              <div :key="index">
              <input type="radio" :value="index" v-model="icon2d">
              <img
                class="ml-2"
                :src="'/assets/img/map_themes/grass/block/Picon2D'+
                    (index-1).toString().padStart(3,'0')+'.gif'" />
              </div>
            </template>
          </template>
          <template v-else-if="colonyData[colony.slug].map_theme === 'desert'">
            <template v-for="index in 7">
              <div :key="index">
              <input type="radio" :value="index" v-model="icon2d">
              <img
                class="ml-2"
                :src="'/assets/img/map_themes/desert/block/Picon2D'+
                    (index-1).toString().padStart(3,'0')+'.gif'" />
              </div>
            </template>
          </template>
          <template v-else-if="colonyData[colony.slug].map_theme === 'cyberhood'">
            <template v-for="index in 5">
              <div :key="index">
              <input type="radio" :value="index" v-model="icon2d">
              <img
                class="ml-2"
                :src="'/assets/img/map_themes/cyberhood/block/Picon2D'+
                    (index-1).toString().padStart(3,'0')+'.gif'" />
              </div>
            </template>
          </template>
        </div>

        <hr class="my-5" />

        <h3 class="font-bold mb-3">Your 3D House</h3>

        <p class="mb-3">Now it's time to choose your fabulous 3D home.
          Please check your bank account at: My Info > Personal Info >Money
          (MyInfo button on Control Panel in right frame) before deciding because
          it's really tough to get a loan around here.</p>


        <div class="grid grid-cols-2 gap-5">
          <div>
            <input type="radio" v-model="home3d" class="mr-3"/>None
          </div>
          <div></div>
          <template v-for="(item,key) in homeData" >
            <div :key="key">
              <input type="radio" :value="key" v-model="home3d" class="mr-3"/>
              <img :src="'/assets/img/homes/Picon3D' + key + '.gif'" /><br/>
              Price: <strong>{{ item.price }}cc</strong>
            </div>
          </template>
        </div>

        <div v-if="showError" class="text-center text-red-500">{{ error }}</div>
        <div class="text-center">
          <button type="button" class="btn" @click="settle">Settle</button>
          <button type="button" class="btn" @click="$router.back()">Back</button>
        </div>
      </div>

    </div>
    <div v-if="complete">
      <p class="text-center">Congratulations,
        <strong>{{ $store.data.user.username }}</strong>!<br />
        You have settled down and are now a <strong>Resident</strong>!
      </p>

      <p class="text-center">
        <router-link :to="'/block/'+$route.params.id" target="place">Click here</router-link>
        to update the block and enter your new home ...
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { colonyDataHelper, homeDataHelper } from "@/helpers";

export default Vue.extend({
  name: "BlockMovePage",
  props: [
    "block",
    "hood",
    "colony",
  ],
  data: () => {
    return {
      loaded: false,
      showError: false,
      error: "",
      homeResponse: undefined,
      relocating: null,
      complete: false,
      locations: [],
      homeData: homeDataHelper,
      colonyData: colonyDataHelper,
      houseName: "",
      houseDescription: "",
      firstName: "",
      lastName: "",
      icon2d: null,
      home3d: null,
    };
  },
  methods: {
    getData(): Promise<void> {
      return Promise.all([
        this.$http.get("/block/" + this.$route.params.id + "/locations"),
        this.$http.get("/home"),
      ]).then((response) => {
        this.locations = response[0].data.locations;
        this.homeResponse = response[1].data;

        if(this.homeResponse.homeData) {
          this.relocating = true;
        } else {
          this.relocating = false;
        }

        document.title = "Move - Cybertown";
        this.loaded = true;
      });
    },
    async settle() {
      this.showError = false;
      this.error = "";

      try {
        await this.$http.post("/home/settle", {
          blockId: this.$route.params.id,
          location: this.$route.params.location,
          houseName: this.houseName,
          houseDescription: this.houseDescription,
          firstName: this.firstName,
          lastName: this.lastName,
          icon2d: this.icon2d,
          home3d: this.home3d,
        });

        this.$store.data.user.hasHome = true;
        this.complete = true;

      } catch(e) {
        this.error = e.response.data.error;
        this.showError = true;
      }
    },
    async relocate() {
      this.showError = false;
      this.error = "";

      try {
        await this.$http.post("/home/move", {
          blockId: this.$route.params.id,
          location: this.$route.params.location,
        });

        this.complete = true;

      } catch(e) {
        this.error = e.response.data.error;
        this.showError = true;
      }
    },
  },
  mounted() {
    this.getData();

  },
});
</script>
