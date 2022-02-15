import api from "./api";
import appStore from "./appStore";

declare module "vue/types/vue" {
  interface Vue {
    $http: api,
    $store: appStore,
  }
}