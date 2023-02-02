<template>
  <div class="h-full w-full bg-black flex flex-col p-2" v-if="loaded">
    <div v-if="showError" class="text-center text-red-500">{{ error }}</div>

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
        <p class="text-center font-weight-bold">Settle down here!</p>

        <div class="text-center">
          <button type="button" class="btn" @click="settle">Yes</button>
          <button type="button" class="btn" @click="$router.back()">No</button>
        </div>

        <table>
          <tr>
            <td style="width:150px"><strong>House Name</strong></td>
            <td><input maxlength="32" size="20" v-model="houseName"/></td>
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

          <tr><td colspan="2">&nbsp;</td></tr>

          <tr>
            <td><strong>House icons</strong></td>
            <td>
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
            </td>
          </tr>

          <tr><td colspan="2">&nbsp;</td></tr>

          <tr>
            <td><strong>3D Houses</strong></td>
            <td>
              <input type="radio" v-model="home3d"/>None <br />

              <template v-for="(item,key) in homeData" >
                <input type="radio" :value="key" v-model="home3d"/>
                <img :src="'/assets/img/homes/Picon3D' + key + '.gif'" />
                Price: {{ item.price }}
                <br />
              </template>
            </td>
          </tr>
        </table>
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
  data: () => {
    return {
      loaded: false,
      showError: false,
      error: "",
      block: undefined,
      hood: undefined,
      colony: undefined,
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
        this.$http.get("/block/" + this.$route.params.id),
        this.$http.get("/block/" + this.$route.params.id + "/locations"),
        this.$http.get("/member/home"),
      ]).then((response) => {
        this.block = response[0].data.block;
        this.hood = response[0].data.hood;
        this.colony = response[0].data.colony;
        this.locations = response[1].data.locations;
        this.$store.methods.setPlace(response[0].data);
        this.homeResponse = response[2].data;

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
        await this.$http.post("/member/home/settle", {
          blockId: this.$route.params.id,
          location: this.$route.params.location,
          houseName: this.houseName,
          houseDescription: this.houseDescription,
          firstName: this.firstName,
          lastName: this.lastName,
          icon2d: this.icon2d,
          home3d: this.home3d,
        });

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
        await this.$http.post("/member/home/move", {
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
