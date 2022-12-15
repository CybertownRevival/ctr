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
               style="height:40px;">
            <template v-if="locations.find(b => b.location === index)" >

              <router-link
                v-if="locations.find(b => b.location === index).id"
                :to="'/block/' + locations.find(b => b.location === index).id"
                class="w-full h-full block text-center flex items-center justify-center">
                <span>
                  <img :src="mapIconImage(locations.find(b => b.location === index).map_icon_index)"
                       :title="locations.find(b => b.location === index).name"/>
                </span>
              </router-link>
              <router-link
                v-else-if="locations.find(b => b.location === index).available"
                :to="'/block/' + $route.params.id + '/move/' + index"
                class="w-full h-full block text-center flex items-center justify-center">
                <span>
                  <img :src="freeImage" />
                </span>
              </router-link>
            </template>
          </div>

        </div>
      </div>
      <h2>You've landed at {{ this.block.name }}</h2>
      Above is a detailed map of the {{ this.block.name }} block.
      Lots marked as "Free" are available for your new home.

    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { BlockData } from "./block-data.interface";
import { colonyDataHelper } from '@/helpers';

export default Vue.extend({
  name: "BlockPage",
  data: (): BlockData => {
    return {
      loaded: false,
      block: undefined,
      hood: undefined,
      colony: undefined,
      locations: [],
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

        document.title = this.block.name + " - Cybertown";
        this.loaded = true;
      });

    },
    mapIconImage (index) {
      return "/assets/img/map_themes/" + colonyDataHelper[this.colony.slug].map_theme +
        "/block/Picon2D"+(index-1).toString().padStart(3,"0")+".gif";
    },
  },
  computed: {
    mapBackground () {
      return "url('/assets/img/map_themes/" + colonyDataHelper[this.colony.slug].map_theme +
        "/block/Pimg2D000.gif')";
    },
    freeImage () {
      return "/assets/img/map_themes/" + colonyDataHelper[this.colony.slug].map_theme +
        "/block/Ficon2D000.gif";
    },
  },
  mounted() {
    this.getData();
  },
  async beforeDestroy() {
  },
});
</script>
