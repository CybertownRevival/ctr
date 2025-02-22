<template>
  <div class="h-full w-full bg-black flex flex-col p-2" v-if="loaded">
    <!-- archive template: property/update.tmpl -->
    <template v-if="!hasHome">
      <div class="text-center mb-3">
        <h3>You don't have a home yet.</h3>
        <p>You must first settle into a block before you can update your home.</p>
      </div>
    </template>
    <template v-else>
      <div class="text-center mb-3">
        <h3>Update your Home</h3>
        <p>Here you can change your personal home, information, image and even more ...!</p>
      </div>

      <div class="mx-auto max-w-2xl grid grid-cols-3 gap-4">
        <div
          v-for="(item,key) in links" :key="key"
          class="text-center">
          <template v-if="!item.blank">
            <router-link :to="item.link" v-if="item.link.length > 0">
              <img :src="item.img" />
              <br /><strong>{{ item.label }}</strong>
            </router-link>
            <template v-else>
              <img :src="item.img" />
              <br /><strong>{{ item.label }}</strong>
            </template>
          </template>
        </div>
      </div>

    </template>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "HomeUpdatePage",
  data: () => {
    return {
      loaded: false,
      hasHome: false,
      place_id: null,
      links: [],
    };
  },
  methods: {
    async getHome() {
      console.log("get home")
      try {
        const homeResponse = await this.$http.get("/home");
        this.place_id = homeResponse.data.homeData.id;
        this.hasHome = !!homeResponse.data.homeData;
        this.loaded = true;
        this.getLinks();
      } catch(e) {
        console.error(e);
      }
    },
    getLinks() {
      const links  = [
        {
          img: '/assets/img/homes/updhome.jpg',
          label: 'Home',
          link: '/home/update/home',
        },
        {
          img: '/assets/img/homes/updinfo.jpg',
          label: 'Information',
          link: '',
        },
        {
          img: '/assets/img/homes/updimage.jpg',
          label: 'Image',
          link: '',
        },
        {
          img: '/assets/img/homes/updinfo.jpg',
          label: 'Reset',
          link: '',
        },{
          img: '/assets/img/homes/updright.jpg',
          label: 'Chat Access Rights',
          link: '',
        },
        {
          img: '/assets/img/homes/updpet.jpg',
          label: 'Configure Virtual Pet',
          link: `/virtualpet/${this.place_id}`,
        },
        {
          blank: true,
        },
        {
          img: '',
          label: '',
          link: '',
        },
      ];
      this.links = links;
    }
  },
  mounted() {
    this.getHome();
  },
});
</script>
