import Vue from "vue"
import VueRouter from "vue-router";

import App from "./App.vue"
import api from "./api";
import appStore from "./appStore";
import routes from "./routes";
import "./assets/index.scss";

Vue.config.productionTip = false

const router = new VueRouter({ routes });

Vue.use(VueRouter);

Vue.prototype.$http = api;
Vue.prototype.$store = appStore;

document.querySelector("html").classList.add("dark")

//todo, this
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title + " - Cybertown";
  } else {
    document.title = "Cybertown";
  }

  if (!["login", "logout", "signup", "forgot", "password_reset"].includes(to.name)) {
    api.get("/member/session").then(response => {
      const { user } = <{ user: string }> response.data;
      appStore.data.user = user;
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

new Vue({
  router,
  render: h => h(App),
}).$mount("#app")
