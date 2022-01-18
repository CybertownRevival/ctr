import Vue from 'vue';

const appStore = Vue.observable({
    data: {
        loading: false,
        isUser: false,
        x3dReady: false,
        user: {},
    },
    methods: {
        destroySession() {
            localStorage.removeItem('token');
            appStore.data.isUser = false;
        }
    }
});
export default appStore;
