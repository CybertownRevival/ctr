import Vue from "vue";
import VueRouter from "vue-router";
import VueGtag from "vue-gtag";

import App from "./App.vue";
import api from "./api";
import appStore, {User} from "./appStore";
import * as filters from "./helpers/fiters";
import routes from "./routes";
import socket from "./socket";
import "./assets/index.scss";

Vue.config.productionTip = false;

// register global utilities/filters
Object.keys(filters).forEach(key => {
  Vue.filter(key, filters[key]);
});
Vue.prototype.$http = api;
Vue.prototype.$store = appStore;
Vue.prototype.$socket = socket;

document.querySelector("html").classList.add("dark");

const router = new VueRouter({ routes });
Vue.use(VueRouter);
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = `${ to.meta.title } - Cybertown`;
  } else {
    document.title = "Cybertown";
  }
  if (to.fullPath.includes("/place/")) {
    api.get<any>(`/place/${to.params.id}`)
      .then(response => {
        const Data = response.data;
        const place = {...Data.place};
        appStore.methods.setPlace(place);
      });
  } else if (to.fullPath.includes("/club/")) {
    api.get<any>(`/place/by_id/${to.params.id}`)
      .then(response => {
        const Data = response.data;
        //check if user is a member of the club
        api.get<any>(`/club/ismember?clubId=${Data.place.id}`)
          .then(response => {
            const member = response.data.isMember;
            if (!member) {
              next(`/clubdoor/${Data.place.id}`);
            }
          });
        const place = {
          ...Data.place,
          assets_dir: "club/vrml/",
          world_filename: "vrml.wrl",
        };
        appStore.methods.setPlace(place);
      });
  } else if (to.fullPath.includes("/clubdoor/")) {
    api.get<any>(`/place/by_id/${to.params.id}`)
      .then(response => {
        const Data = response.data;
        appStore.methods.setPlace(Data.place);
      });
  } else {
    api.get<any>(`/home/${ to.params.username }`)
      .then(response => {
        const Data = response.data;
        const place = {
          ...Data.homeData,
          assets_dir: Data.homeDesignData ?
            (`${ Data.homeDesignData.id  }/`) : null,
          world_filename: "home.wrl",
          slug: "home",
          block: Data.blockData,
        };
        appStore.methods.setPlace(place);
      });
  }

  if (!["login", "logout", "signup", "forgot", "password_reset",
    "about", "privacypolicy", "rulesandregulations", "banned"]
    .includes(to.name)) {
    api.get<{
      user: User,
      status: number,
      roleName: string,
      banned: boolean,
      banInfo: any,
    }>("/member/session")
      .then(response => {
        const { user } = response.data;
        const  { banInfo, banned } = response.data;
        if (banned) {
          if (
            banInfo.type === "jail" &&
           to.fullPath.includes("/messageboard/") ||
           to.fullPath.includes("/inbox/") ||
           to.fullPath.includes("/information/")
          ){
            next("/restricted");
          } else if (to.fullPath === "/restricted") {
            next();
          } else if (to.fullPath !== "/place/jail" && banInfo.type === "jail") {
            next("/place/jail");
            api.get<any>("/place/jail")
              .then(response => {
                const Data = response.data;
                const place = {...Data.place};
                appStore.methods.setPlace(place);
              });
          } else if (to.fullPath === "/place/jail") {
            next();
          } else {
            appStore.methods.destroySession();
            next({
              name: "banned",
              params: {
                reason: banInfo.reason,
                enddate: banInfo.end_date,
              },
            });
          }
        }
        appStore.methods.setUser(user);
        appStore.data.isUser = true;
        next();
      }).catch(() => {
        appStore.methods.destroySession();
        if (to.name !== "home") {
          next({
            name: "login",
            query: { redirect: to.fullPath },
          });
        } else {
          next();
        }
      });
  } else {
    next();
  }
});

Vue.use(VueGtag, {
  pageTrackerTemplate(to) {
    return {
      page_title: document.title,
      page_path: to.path,
    };
  },
  config: { id: "G-BCMREM3LDH" },
}, router);

new Vue({
  router,
  render: h => h(App),
}).$mount("#app");
