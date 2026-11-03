<template>
  <div class="p-4 text-center">
    <div v-if="loading">
      Loading neighbourhood...
    </div>

    <div v-else-if="!canAdmin">
      <div class="text-2xl font-bold text-green">
        Access Denied
      </div>
      <p class="mt-4">
        You do not have permission to update this neighbourhood.
      </p>
    </div>

    <div v-else>
      <div class="text-2xl font-bold text-green mb-4">
        Neighbourhood Update
      </div>

      <p class="mb-4">
        Select an existing block to manage it.
      </p>

      <div class="inline-block mx-auto">
        <div
          class="grid grid-cols-6 gap-0"
          :style="{
            padding: '16px 19px 13px 10px',
            width: '540px',
            height: '300px',
            'background-image': mapBackground
          }"
        >
          <div
            v-for="index in 30"
            :key="index"
            style="height: 53px;"
          >
            <button
              v-if="getBlockAtLocation(index)"
              type="button"
              class="w-full h-full block text-center flex items-center justify-center"
              :class="{
                'text-red-500': getBlockAtLocation(index).status === 0
              }"
              :style="{
                'background-image': blockBackground
              }"
              @click="selectBlock(getBlockAtLocation(index))"
            >
              {{ getBlockAtLocation(index).name }}
            </button>
          </div>
        </div>
      </div>

      <p class="mt-4">
        Closed blocks will remain visible here for management.
      </p>

      <div class="mt-6">
        <router-link
          :to="{
            name: 'neighborhoodpage',
            params: { id: $route.params.id }
          }"
          class="btn-ui inline-block"
        >
          Back
        </router-link>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { colonyDataHelper } from "@/helpers";

interface Block {
  id: number;
  name: string;
  status: number;
  location: number;
}

export default Vue.extend({
  name: "NeighborhoodUpdatePage",

  data: () => ({
    loading: true,
    canAdmin: false,
    colony: null as any,
    blocks: [] as Block[],
  }),

  methods: {
    async loadNeighbourhood() {
      try {
        const response = await this.$http.get(
          `/hood/${this.$route.params.id}`,
        );

        const place = response.data.hood;
        place.hood = response.data.hood;
        place.colony = response.data.colony;

        this.colony = response.data.colony;

        this.$store.methods.setPlace(place);

        document.title = `${place.name} - Cybertown`;
      } catch (error) {
        console.error("Failed to load neighbourhood", error);
      }
    },

    async loadBlocks() {
      try {
        const response = await this.$http.get(
          `/hood/${this.$route.params.id}/blocks`,
        );

        this.blocks = response.data.blocks;
      } catch (error) {
        console.error(
          "Failed to load neighbourhood blocks",
          error,
        );

        this.blocks = [];
      }
    },

    selectBlock(block: Block | undefined) {
      if (!block) return;

      this.$router.push({
        name: "neighborhoodBlockUpdate",
        params: {
          id: this.$route.params.id,
          blockId: String(block.id),
        },
      });
    },

    getBlockAtLocation(location: number): Block | undefined {
      return this.blocks.find(
        block => block.location === location,
      );
    },

    async checkPermissions() {
      this.loading = true;
      this.canAdmin = false;
      this.blocks = [];
      this.colony = null;

      try {
        await this.loadNeighbourhood();

        const response = await this.$http.get(
          `/hood/${this.$route.params.id}/can_admin`,
        );

        this.canAdmin = response.data.result === true;

        if (this.canAdmin) {
          await this.loadBlocks();
        }
      } catch (error) {
        console.error(
          "Failed to check neighbourhood permissions",
          error,
        );

        this.canAdmin = false;
      } finally {
        this.loading = false;
      }
    },
  },

  computed: {
    mapBackground(): string {
      if (!this.colony) return "";

      const theme = colonyDataHelper[this.colony.slug].map_theme;

      return `url('/assets/img/map_themes/${theme}/hood/Pimg2D000.gif')`;
    },

    blockBackground(): string {
      if (!this.colony) return "";

      const theme = colonyDataHelper[this.colony.slug].map_theme;

      return `url('/assets/img/map_themes/${theme}/hood/Picon2D000.gif')`;
    },
  },

  mounted() {
    this.checkPermissions();
  },

  watch: {
    "$route.params.id"() {
      this.checkPermissions();
    },
  },
});
</script>