import Vue from 'vue'
import VueRouter from "vue-router";
import App from './App.vue'
import routes from "./routes";
import api from "./api";
import appStore from "./appStore";
import './assets/index.scss';

Vue.config.productionTip = false

const router = new VueRouter({
    routes
});


Vue.use(VueRouter);
Vue.use(router,api);

Vue.prototype.$http = api;
Vue.prototype.$store = appStore;

document.querySelector('html').classList.add('dark')

//todo, this
router.beforeEach((to, from, next) => {
    if(to.meta.title) {
        document.title = to.meta.title+' - Cybertown';
    } else {
        document.title = 'Cybertown';
    }

    if(to.name !== 'login' && to.name !== 'signup' && to.name !== 'logout' && to.name !== 'forgot' && to.name !== 'password_reset') {
        api.get('/member/session')
            .then(response => {
                appStore.data.user = response.data.user;
                appStore.data.isUser = true;
                next();
            })
            .catch(() => {
                appStore.methods.destroySession();
                if(to.name !== 'home') {
                    next({
                        name: 'login',
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

// eslint-disable-next-line
new Vue({
    router,
    render: h => h(App),
}).$mount('#app')
