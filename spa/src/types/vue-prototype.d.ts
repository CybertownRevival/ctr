import api from "../api";
import { AppStore } from "../appStore";
import { VueWithCustomFilters } from '../filters';
import { SocketManager } from "../socket";

declare module "vue/types/vue" {
  interface Vue extends VueWithCustomFilters {
    $http: api,
    $socket: SocketManager,
    $store: AppStore,
  }
}