import api from "../api";
import { AppStore } from "../appStore";
import { SocketManager } from "../socket";
declare module "vue/types/vue" {
  interface Vue {
    $http: api,
    $socket: SocketManager,
    $store: AppStore,
  }
}