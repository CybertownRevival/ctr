<template>
  <main id="app" class="h-screen flex flex-col" v-if="this.$route.meta.wrapper">
    <div
      class="flex flex-none flex-row bg-lines justify-between h-full"
      style="height: 70px;"
      v-if="$store.data.isUser"
    >
      <div class="flex h-full items-center">
        <img src="/assets/img/ctMinaBanner.gif" />
      </div>
      <div class="flex h-full text-right items-center">
        <img src="/assets/img/news.gif" />
      </div>
    </div>
    <div
      class="flex flex-row flex-grow"
      style="height: calc(100vh - 70px) !important"
    >
      <div class="flex flex-1">
        <router-view
          v-if="this.$route.name !== 'world-browser' && this.$route.name !== 'user-home'"></router-view>
        <world-browser-page
          v-show="this.$route.name === 'world-browser' || this.$route.name === 'user-home'"></world-browser-page>
      </div>
      <div
        class="flex-none w-60 bg-lines overflow-y-auto"
        v-if="$store.data.isUser"
      >
        <div class="flex flex-col">
          <div class="flex justify-center">
            <img src="/assets/img/logo-action.gif" />
          </div>
          <div class="flex flex-row justify-center">
            <img src="/assets/img/b2dchat.gif" @click="$store.methods.setView3d(false)"
                 class="cursor-pointer"/>
            <img src="/assets/img/b3dchat.gif" @click="$store.methods.setView3d(true)"
                 class="cursor-pointer"/>
          </div>
          <div class="flex justify-center">
            <div class="menu">
              <a href="#"
                class="menuLink"
                @click="openInfoModal"
                style="top: 78px"
              ></a>
              <router-link
                 class="menuLink"
                 style="top: 98px"
                 v-if="$store.data.user.hasHome"
                 :to="'/home/'+$store.data.user.username"
              ></router-link>
              <router-link to="/citymap"
                 class="menuMapLink"
              ></router-link>
            </div>
          </div>
          <div class="flex justify-center">
            <img src="/assets/img/outlandico.jpeg" />
          </div>
          <div class="px-8">
            <select
              class="w-full text-black"
              @change="changeJumpGate()"
              v-model="jumpGate"
            >
              <option value="">JUMP GATE</option>
              <option value=""></option>
              <option v-for="option in jumpGateData" :value="option.slug">
                {{ option.title }}
              </option>
            </select>
          </div>
          <div>
            <br />
            <router-view name="tools"></router-view>
            <a
              href="https://github.com/CybertownRevival/ctr/issues"
              class="btn-ui"
              target="_blank"
              >
              Report a Bug
            </a>
            <br />
            <router-link to="/logout" class="btn-ui">Logout</router-link>
            <br />
            <br />
            <p align="center">
              <a
                href="https://kdaws.com/"
                target="_blank"
                class="text-center inline-block p-3 rounded-sm"
                style="margin: 0 auto"
              >
                <img
                  src="/assets/img/kda-logo-white.png"
                  style="width: 96px; height: auto"
                  title="Hosted by KDA Web Services"
                />
              </a>
              <br />
            </p>
          </div>
        </div>
      </div>
    </div>
    <ModalRoot />
  </main>
  <main id="app" v-else-if="!this.$route.meta.wrapper">
    <div style="height: calc(100vh - 70px) !important;">
      <router-view/>
    </div>
  </main>
</template>

<script lang="ts">
import Vue from "vue";

import WorldBrowserPage from "./pages/world-browser/WorldBrowserPage.vue";
import ModalRoot from "./components/modals/ModalRoot.vue"
import InfoModal from "./components/modals/InfoModal.vue"
import ModalService from "./components/modals/services/ModalService.vue"

declare const X3D: any;

export default Vue.extend({
  name: "App",
  components: {
    WorldBrowserPage,
    ModalRoot,
  },
  data: () => {
    return {
      jumpGateData: [
        {
          title: "COLONIES:",
          slug: "",
        },
        {
          title: "Sci-fi",
          slug: "scifi_col",
        },
        {
          title: "Entertainment",
          slug: "ent_col",
        },
        {
          title: "Games",
          slug: "games_col",
        },
        {
          title: "Virtual Worlds",
          slug: "vrtwrlds_col",
        },
        {
          title: "Cyberhood",
          slug: "cyberhood",
        },
        {
          title: "Inner Realms",
          slug: "inrlms_col",
        },
        {
          title: "The Campus",
          slug: "campus",
        },
        {
          title: "Adventure",
          slug: "ad_col",
        },
        {
          title: "Hi-Tek",
          slug: "hitek_col",
        },
        {
          title: "9th Dimension",
          slug: "9thdimension",
        },
        {
          title: "-----------------------",
          slug: "",
        },
        {
          title: "The Plaza",
          slug: "enter",
        },
        {
          title: "Flea Market",
          slug: "fleamarket",
        },
        {
          title: "Mall",
          slug: "mall",
        },
        {
          title: "Bank",
          slug: "bank",
        },
        {
          title: "Sunset Beach",
          slug: "beach",
        },
        {
          title: "Water Park",
          slug: "waterpark",
        },
        {
          title: "Theme Park",
          slug: "themepark",
        },
        {
          title: "City Hall",
          slug: "cityhall",
        },
        {
          title: "Performing Arts",
          slug: "theatre",
        },
        {
          title: "The Pool",
          slug: "pool",
        },
        {
          title: "The Stadium",
          slug: "stadium",
        },
        {
          title: "The Post Office",
          slug: "postoffice",
        },
        {
          title: "Game Show",
          slug: "gameshow",
        },
        {
          title: 'Black Market',
          slug: "blackmarket"
        },
        {
          title: "Jail",
          slug: "jail"
        },
        {
          title: "Fun Park",
          slug: "funpark",
        },
        {
          title: "Theatre",
          slug: "theatre",
        },
        {
          title: "(more coming soon)",
          slug: "",
        },
        /* For the curious developers. These worlds need fixing to work (see dev tools console)
               
                {
                    'title': 'Employment Office',
                    "slug": "employment"
                },
                {
                    'title': 'Outlands',
                    "slug": "outlands"
                },
                {
                    'title': 'Le Cafe',
                    "slug": "cafe"
                },
                {
                    'title': 'Library (missing wrl)',
                    "slug": "library"
                },
                {
                    'title': 'Fun Park',
                    "slug": "funpark"
                },
                {
                    'title': 'Fun Park',
                    "slug": "funpark"
                },

                 */
        {
          title: "-----------------------",
          slug: "",
        },
        {
          title: "HOME DEMOS:",
          slug: "",
        },
        {
          slug: "home03",
          title: "Home 1",
        },
        {
          slug: "home00",
          title: "Home 1 (Furnished)",
        },
        {
          slug: "home04",
          title: "Home 2",
        },
        {
          slug: "home01",
          title: "Home 2 (Furnished)",
        },
        {
          slug: "home05",
          title: "Home 3",
        },
        {
          slug: "home02",
          title: "Home 3 (Furnished)",
        },
        {
          slug: "home06",
          title: "Home 4",
        },
        {
          slug: "home07",
          title: "Home 5",
        },
        {
          slug: "home0a",
          title: "Home 6",
        },
      ],
      jumpGate: "",
    };
  },
  methods: {
    changeJumpGate(): void {
      if (this.jumpGate?.length) {
        this.$router.push({ path: `/place/${this.jumpGate}` });
        this.jumpGate = "";
      }
    },
    openInfoModal(): void {
      ModalService.open(InfoModal);
    },
  },
  mounted() {
    //todo populate jumpgate with worlds

    X3D(
      () => {
        console.log("starting X3d");
        this.$store.data.x3dReady = true;
      },
      (error) => {
        console.error(error);
      },
    );
    require("./libs/x_ite_mods/spec_color.js");
    require("./libs/x_ite_mods/relax_route.js");
    require("./libs/x_ite_mods/relax_is.js");
    require("./libs/x_ite_mods/arrow_keys.js");
    require("./libs/x_ite_mods/viewpoint_bind.js");
    require("./libs/x_ite_mods/allow_sf_string.js");
    //require('./libs/x_ite_mods/speed_multiplier.js');
    require("./libs/x_ite_mods/bxx_speed_avatar.js");
    require("./libs/x_ite_mods/default_gravity.js");
    require("./libs/x_ite_mods/extend_context_menu.js");
    require("./libs/x_ite_mods/bxx_auth.js");
    //require('./libs/x_ite_mods/fix_stairs.js');
  },
});
</script>
