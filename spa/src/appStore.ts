import Vue from 'vue';

/** Represents the shape of user data object on the global app store */
export interface User {
  avatar?: {
    id: string,
    name: string,
    filename: string,
    gestures: string[],
  },
  username?: string,
  token?: string,
}

/** Represents the shape of the global app store object */
export interface AppStore {
  data: {
    loading: boolean,
    isUser: boolean,
    x3dReady: boolean,
    user: User,
  },
  methods: {
    destroySession: () => void,
    setToken: (token: string) => void
  },
}

const appStore = Vue.observable<AppStore>({
  data: {
    loading: false,
    isUser: false,
    x3dReady: false,
    user: {
      token: localStorage.getItem("token"),
    },
  },
  methods: {
    destroySession() {
      localStorage.removeItem("token");
      appStore.data.user = {};
      appStore.data.isUser = false;
    },
    setToken(token: string): void {
      appStore.data.user.token = token;
      localStorage.setItem("token", token);
    }
  }
});
export default appStore;
