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
  hasHome?: boolean,
}

export interface Place {
  assets_dir?: string,
  block?: object,
  hood?: object,
  created_at?: string,
  description?: string,
  id?: number | string,
  map_background_index?: string,
  map_icon_index?: string,
  member_id?: number,
  name?: string,
  slug?: string,
  status?: number,
  type?:string,
  updated_at?: string,
  world_filename?: string,
}

/** Represents the shape of the global app store object */
export interface AppStore {
  data: {
    loading: boolean,
    isUser: boolean,
    x3dReady: boolean,
    user: User,
    view3d: boolean,
    place: Place,
  },
  methods: {
    destroySession: () => void,
    setToken: (token: string) => void,
    setView3d: (value: boolean) => void,
    setPlace: (value: Place) => void,
    setUser: (userData: object) => void
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
    place: {},
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
    setPlace(placeData: Place): void {
      appStore.data.place = placeData;
    },
    setUser(userData: User): void {
      if(typeof userData.avatar !== "undefined" && typeof userData.avatar.gestures === "string") {
        userData.avatar.gestures = JSON.parse(userData.avatar.gestures);
      }
      appStore.data.user = { ...appStore.data.user, ...userData };
    },
  },
});
export default appStore;
