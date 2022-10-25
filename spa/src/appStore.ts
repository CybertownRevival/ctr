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
  admin?: boolean,
}

/** Represents the shape of the global app store object */
export interface AppStore {
  data: {
    loading: boolean,
    isUser: boolean,
    x3dReady: boolean,
    user: User,
    view3d: boolean,
    place: object
  },
  methods: {
    destroySession: () => void,
    setToken: (token: string) => void,
    setView3d: (value: boolean) => void,
    setPlace: (value: object) => void,
  },
}

const appStore = Vue.observable<AppStore>({
  data: {
    loading: false,
    isUser: false,
    x3dReady: false,
    view3d: false,
    user: {
      token: localStorage.getItem("token"),
    },
    place: {}
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
    },
    setView3d(value: boolean): void {
      appStore.data.view3d = value;
    },
    setPlace(placeData: object): void{
      appStore.data.place = placeData;
    },
  },
});
export default appStore;
