import Vue from "vue"
import VueRouter from "vue-router";
import VueGtag from "vue-gtag";

import App from "./App.vue"
import api from "./api";
import appStore from "./appStore";
import { User } from "./appStore";
import * as filters from './helpers/fiters';
import routes from "./routes";
import socket from "./socket";
import "./assets/index.scss";

Vue.config.productionTip = false

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
    document.title = to.meta.title + " - Cybertown";
  } else {
    document.title = "Cybertown";
  }

  if (!["login", "logout", "signup", "forgot", "password_reset","about"].includes(to.name)) {
    api.get<{ user: User }>("/member/session").then(response => {
      const { user } = response.data;
      appStore.methods.setUser(user);
      appStore.data.isUser = true;
      next();
    }).catch(() => {
      appStore.methods.destroySession();
      if (to.name !== "home") {
        next({
          name: "login",
          query: { redirect: to.fullPath }
        });
      } else {
        next();
      }
    })
  } else {
    next();
  }
});

Vue.use(VueGtag, {
  pageTrackerTemplate(to) {
    return {
      page_title: document.title,
      page_path: to.path,
    }
  },
  config: { id: "G-BCMREM3LDH" },
}, router);

new Vue({
  router,
  render: h => h(App),
}).$mount("#app");
