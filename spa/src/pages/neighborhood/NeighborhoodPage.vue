<template>
  <div class="h-full w-full bg-black flex flex-col" v-if="loaded">
    <div class="w-full flex-1 text-center">
      <div class="inline-block mx-auto">
        <div :style="{
        padding: '16px 19px 13px 10px',
        width: '540px',
        height: '300px',
        'background-image': mapBackground ,
      }"
             class="grid grid-cols-6 gap-0">

          <div v-for="index in 30" :key="index"
               style="height:53px;">
            <template v-if="blocks.find(b => b.location === index)" >
              <router-link :to="'/block/' + blocks.find(b => b.location === index).id"
                           class="w-full h-full block text-center flex items-center justify-center"
                           :style="{
              'background-image': blockBackground
            }">
                <span>{{ blocks.find(b => b.location === index).name }}</span>
              </router-link>
            </template>
          </div>

        </div>
      </div>
      <br/>
      <small>Click a block on the Neighborhood map above to go to the homes</small>
    </div>
    <div class="flex flex-none h-1/3 bg-chat">
      <chat
        ref="chat"
        v-if="loaded"
        :place="hood"
      ></chat>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Chat from "../../components/Chat.vue";
import { NeighborhoodData } from "./neighborhood-data.interface";
import { colonyDataHelper } from '@/helpers';

export default Vue.extend({
  name: "NeighborhoodPage",
  components: { Chat },
  data: (): NeighborhoodData => {
    return {
      loaded: false,
      hood: undefined,
      colony: undefined,
      blocks: [],
    };
  },
  methods: {
    getPlace(): Promise<void> {
      return Promise.all([
        this.$http.get("/hood/" + this.$route.params.id),
        this.$http.get("/hood/" + this.$route.params.id + "/blocks"),
      ]).then((response) => {
        this.hood = response[0].data.hood;
        this.colony = response[0].data.colony;
        this.blocks = response[1].data.blocks;
        document.title = this.hood.name + " - Cybertown";
      });
    },
    async loadAndJoinPlace(): Promise<void> {
      this.loaded = false;
      await this.getPlace();
      this.loaded = true;

      this.joinPlace();
    },

    async unloadPlace(): Promise<void> {
      if (this.hood) this.$socket.leaveRoom(this.hood.id);
    },
    async joinPlace(): Promise<void> {
      await this.$socket.joinRoom(this.hood.id, this.$store.data.user.token);
    },
  },
  watch: {
  },
  computed: {
    mapBackground () {
      return "url('/assets/img/map_themes/" + colonyDataHelper[this.colony.slug].map_theme +
        "/hood/Pimg2D000.gif')";
    },
    blockBackground () {
      return "url('/assets/img/map_themes/" + colonyDataHelper[this.colony.slug].map_theme +
        "/hood/Picon2D000.gif')";
    },
  },
  mounted() {
    this.loadAndJoinPlace();
  },
  async beforeDestroy() {
    await this.unloadPlace();
  },
});
</script>
