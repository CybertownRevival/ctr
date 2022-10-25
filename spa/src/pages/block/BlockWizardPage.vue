<template>
  <div class="h-full w-full bg-black flex flex-col" v-if="loaded">
    <div class="w-full flex-1 text-center">
      <div class="inline-block mx-auto">
        <div :style="{
        width: '480px',
        height: '240px',
        'background-image': mapBackground ,
      }"
             class="grid grid-cols-12 gap-0">

          <div v-for="index in 72" :key="index"
               style="height:40px;line-height:40px;">
            <template v-if="locations.find(b => b.location === index)" >
              <router-link :to="'/block/' + locations.find(b => b.location === index).id"
                           class="w-full h-full block text-center flex items-center justify-center"
                           v-if="locations.find(b => b.location === index).id"
              >
                <span>{{ locations.find(b => b.location === index).name }}</span>
              </router-link>
              <input type="checkbox" v-model="availableLocations" v-else :value="index"/>
            </template>
            <template v-else>
              <input type="checkbox" v-model="availableLocations" :value="index"/>
            </template>
          </div>

        </div>
      </div>

      <p><strong>Update Wizard for block '{{ this.$store.data.place.block.name }}'</strong></p>

      <small>Checkmark the plots where you want members to settle down.</small>
      <br/>
      <button type="button" @click="update" class="btn">Update</button>
      <br/>

      <small>
        Change the
        <a href="block<$g_exe>?ac=wizardimage&ID=<$ID>" target="place">background image</a>
        for this <strong>block</strong>.
      </small>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { BlockData } from "./block-data.interface";
import { colonyDataHelper } from '@/helpers';

export default Vue.extend({
  name: "BlockWizardPage",
  data: () => {
    return {
      loaded: false,
      block: undefined,
      hood: undefined,
      colony: undefined,
      locations: [],
      availableLocations: [],
    };
  },
  methods: {
    getData(): Promise<void> {
      return Promise.all([
        this.$http.get("/block/" + this.$route.params.id),
        this.$http.get("/block/" + this.$route.params.id + "/locations"),
      ]).then((response) => {
        this.block = response[0].data.block;
        this.hood = response[0].data.hood;
        this.colony = response[0].data.colony;
        this.locations = response[1].data.locations;
        this.$store.methods.setPlace(response[0].data);

        this.availableLocations = this.locations
          .filter(location => {
            return location.available;
          })
          .map(loc => {
            return loc.location;
          });


        document.title = this.block.name + " Wizard - Cybertown";
        this.loaded = true;
      });

    },
    update() {
      this.$http.post("/block/" + this.$route.params.id + "/locations", {
        "availableLocations": this.availableLocations,
      })
        .then(() => {
          alert("Block Updated");
        });
    },
  },
  computed: {
    mapBackground () {
      return "url('/assets/img/map_themes/" + colonyDataHelper[this.colony.slug].map_theme +
        "/block/Pimg2d000.gif')";
    },
  },
  mounted() {
    if(!this.$store.data.user.admin) {
      this.$router.push("/restricted");
    } else {
      this.getData();
    }

  },
  async beforeDestroy() {
  },
});
</script>
