<template>
  <div class="h-full w-full bg-black flex flex-col">
    <div class="flex items-center update-warning bg-lines p-1" v-if="showUpdateWarning">
      <strong>
        New Update Available!
        &nbsp;
        <a @click="reloadWindow">
          Please Reload
        </a>
      </strong>
    </div>
    <div id="world" class="world w-full flex-1" style="" v-show="this.$store.data.view3d"></div>
    <div v-show="!this.$store.data.view3d" class="w-full flex-1">
      <component :is="mainComponent"></component>
    </div>
    <div class="flex flex-none h-1/3 bg-chat">
      <chat
        ref="chat"
        v-if="loaded"
        :place="place"
        :shared-event="sharedEvent"
        :shared-objects="sharedObjects"
        @move-object="moveObject"
      ></chat>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import * as avatarsDataJson from "../../libs/data/avatars.json";
import * as worldDataJson from "../../libs/data/worlds.json";
import Chat from "../../components/Chat.vue";
import {
  debugMsg,
  environment,
} from '@/helpers';
import { WorldBrowserData } from './world-browser-data.interface';

export default Vue.extend({
  name: "WorldBrowserPage",
  components: { Chat },
  data: (): WorldBrowserData => {
    return {
      loaded: false,
      worldsData: worldDataJson,
      avatarsData: avatarsDataJson,
      browser: null,
      uniqValue: 0,
      place: undefined,
      position: [0, 0, 0],
      rotation: [0, 0, 0, 0],
      users: {},
      ROTATE180: null,
      TYPES: {},
      sharedEvent: null,
      eventNodeMap: null,
      sharedObjects: [],
      sharedObjectsMap: undefined,
      showUpdateWarning: false,
      mainComponent: null,
    };
  },
  methods: {
    addSharedObject(obj, browser): void {
      obj.url = `/assets/object/${obj.object_id}/${obj.filename}`;
      console.log(obj.position);
      console.log(obj.rotation);
      if (obj.position == null) {
        obj.position = {
          x: 0,
          y: 0,
          z: 0,
        };
      }

      if (obj.rotation == null) {
        obj.rotation = {
          x: 0,
          y: 0,
          z: 0,
          angle: 0,
        };
      }

      let sharedObject = browser.currentScene.createProto("SharedObject");
      sharedObject.name = obj.name;
      sharedObject.id = obj.id;
      console.log(sharedObject);
      sharedObject.translation = new X3D.SFVec3f(
        obj.position.x,
        obj.position.y,
        obj.position.z
      );
      sharedObject.rotation = new X3D.SFRotation(
        obj.rotation.x,
        obj.rotation.y,
        obj.rotation.z,
        obj.rotation.angle
      );
      let inline = browser.currentScene.createNode("Inline");
      inline.url = new X3D.MFString(obj.url);
      sharedObject.children[0] = inline;
      browser.currentScene.addRootNode(sharedObject);
      console.log(sharedObject);
      console.log(sharedObject.import);
      console.log(sharedObject["startMove"]);

      sharedObject.addFieldCallback("newPosition", {}, (pos) => {
        //todo happens when accepted
        console.log("new so position fired");
        this.saveObjectLocation(obj.id);

        /*
            BxxEvents.dispatchEvent(
              new CustomEvent("SO:toServer:position", {
                detail: {
                  id: sharedObject.id,
                  type: "position",
                  value: {
                    x: pos.x,
                    y: pos.y,
                    z: pos.z,
                  },
                },
              })
            );
            */
      });

      sharedObject.addFieldCallback("newRotation", {}, (rot) => {
        //todo happens when accepted
        console.log("new so rotation fired");
        /*
            BxxEvents.dispatchEvent(
              new CustomEvent("SO:toServer:rotation", {
                detail: {
                  id: sharedObject.id,
                  type: "rotation",
                  value: {
                    x: rot.x,
                    y: rot.y,
                    z: rot.z,
                    angle: rot.angle,
                  },
                },
              })
            );
            */
      });
      this.sharedObjectsMap.set(obj.id, sharedObject);
    },
    debugMsg,
    getPlace(): Promise<void> {
      this.debugMsg("get place");
      return Promise.all([
        this.$http.get("/place/" + this.$route.params.id),
        this.$http.get("/place/" + this.$route.params.id + "/object_instance"),
      ]).then((response) => {
        this.place = response[0].data.place;
        document.title = this.place.name + " - Cybertown";
        this.sharedObjects = response[1].data.object_instance;
        this.debugMsg(response[0].data.place);
      });
    },
    async loadAndJoinPlace(): Promise<void> {
      this.loaded = false;
      if (this.place) this.$socket.leaveRoom(this.place.id);
      await this.getPlace();

      if(this.browser) {
        const browser = X3D.getBrowser(this.browser);
        browser.replaceWorld(null);
      }
      if(this.$store.data.view3d) {
        const browser = await this.startX3D();
        this.loaded = true;
        this.startX3DListeners(browser);
      } else {
        this.mainComponent = () => import("@/components/place/"+this.place.slug+"/main2d.vue");
        this.loaded = true;
      }
      this.joinPlace();
    },
    async unloadPlace(): Promise<void> {
      if (this.place) this.$socket.leaveRoom(this.place.id);
      const browser = X3D.getBrowser(this.browser);
      browser.replaceWorld(null);
    },
    async joinPlace(): Promise<void> {
      await this.$socket.joinRoom(this.place.id, this.$store.data.user.token);
      this.debugMsg('joined room success', this.place.id);
      const { viewpointPosition, viewpointOrientation } = X3D.getBrowser(this.browser);
      this.$socket.emit("AV", {
        detail: {
          pos: [
            viewpointPosition.x,
            viewpointPosition.y,
            viewpointPosition.z,
          ],
          rot: [
            viewpointOrientation.x,
            viewpointOrientation.y,
            viewpointOrientation.z,
            viewpointOrientation.angle,
          ],
        },
      });
    },
    moveObject(objectId): void {
      this.sharedObjectsMap.get(objectId).startMove = true;
    },
    async onAvatarAdded(event): Promise<void> {
      const ROTATE180 = new X3D.SFRotation(0, 1, 0, Math.PI);

      const unique = (prefix) => {
        this.uniqValue += 1;
        return prefix + this.uniqValue.toString();
      };

      const loadInlineAsync = (browser, url) => {
        browser.endUpdate();
        //todo: error coming from here about 'url' = ''
        let inline = browser.currentScene.createNode("Inline");
        inline.url = new X3D.MFString(url);
        let loadSensor = browser.currentScene.createNode("LoadSensor");
        loadSensor.watchList[0] = inline;
        let callbackKey = {};
        let promise = new Promise((resolve, reject) => {
          loadSensor.addFieldCallback("isLoaded", callbackKey, (value) => {
            loadSensor.removeFieldCallback("isLoaded", callbackKey);
            if (value) {
              resolve(inline);
            } else {
              reject(inline);
            }
          });
        });
        browser.beginUpdate();
        return promise;
      };

      let browser = X3D.getBrowser(this.browser);

      if (!this.users[event.id]) {
        this.users[event.id] = {};
      }

      if (
        !this.users[event.id].loading &&
        !this.users[event.id].loaded
      ) {
        const { id, filename } = event.avatar;
        const avURL = `/assets/avatars/${id}/${filename}`;

        this.users[event.id].loading = true;
        loadInlineAsync(browser, avURL).then((avInline) => {
          let uniqueID = unique("Av-");
          browser.currentScene.updateImportedNode(avInline, "Avatar", uniqueID);
          var avImport = browser.currentScene.getImportedNode(uniqueID);
          browser.currentScene.addRootNode(avInline);
          this.users[event.id].loading = false;
          this.users[event.id].loaded = true;
          this.users[event.id]["inline"] = avInline;
          this.users[event.id]["import"] = avImport;

          if (this.users[event.id]["inline"]) {
            if (
              this.users[event.id].transform &&
              this.users[event.id].transform.pos
            ) {
              this.users[event.id]["import"].set_position = new X3D.SFVec3f(
                ...this.users[event.id].transform.pos
              );
            }
            if (
              this.users[event.id].transform &&
              this.users[event.id].transform.rot
            ) {
              this.users[event.id]["import"].rotation = ROTATE180.multiply(
                new X3D.SFRotation(...this.users[event.id].transform.rot)
              );
            }
          }
        });
      }
    },
    onAvatarMoved(event): void {
      const ROTATE180 = new X3D.SFRotation(0, 1, 0, Math.PI);
      let browser = X3D.getBrowser(this.browser);

      if (!this.users[event.id]) {
        this.users[event.id] = {};
      }

      if (!this.users[event.id].transform) {
        this.users[event.id].transform = {};
      }

      if (event.pos) {
        this.users[event.id].transform.pos = event.pos;
      }
      if (event.rot) {
        this.users[event.id].transform.rot = event.rot;
      }

      if (this.users[event.id]["inline"]) {
        if (this.users[event.id].transform.pos) {
          this.users[event.id]["import"].set_position = new X3D.SFVec3f(
            ...this.users[event.id].transform.pos
          );
        }
        if (this.users[event.id].transform.rot) {
          this.users[event.id]["import"].rotation = ROTATE180.multiply(
            new X3D.SFRotation(...this.users[event.id].transform.rot)
          );
        }

        if (typeof event.gesture === "number") {
          this.users[event.id]["import"][
            "set_gesture" + event.gesture.toString()
          ] = browser.getCurrentTime();
        }
      }
    },
    onAvatarRemoved(event): void {
      const { id } = event;

      if (this.users[id].inline) {
        X3D.getBrowser(this.browser)
          .currentScene
          .removeRootNode(this.users[id].inline);
      }

      if (this.users[id].import) {
        this.users[id].import.dispose();
      }

      delete this.users[id];
    },
    onSharedEvent(event): void {
      let eventObj = event.detail;
      for (let node of this.eventNodeMap.get(eventObj.name)) {
        node[eventObj.type + "FromServer"] = this.TYPES[eventObj.type].fromJSON(
          eventObj.value
        );
      }
    },
    onVersion(event: { version: string }): void {
      if (event.version !== environment.packageVersion) {
        this.showUpdateWarning = true;
        console.error(
          "Socket server version mismatch:",
          `client: ${environment.packageVersion};`,
          `server: ${event.version}`,
        );
      }
    },
    reloadWindow(): void {
      window.location.reload();
    },
    saveObjectLocation(objectId): void {
      console.log("save object location");
      console.log(objectId);
      var obj = this.sharedObjectsMap.get(objectId);
      console.log(obj.translation);
      console.log(obj.rotation);
      this.$http.post("/object_instance/" + objectId + "/position", {
        position: {
          x: obj.translation.x,
          y: obj.translation.y,
          z: obj.translation.z,
        },
        rotation: {
          x: obj.rotation.x,
          y: obj.rotation.y,
          z: obj.rotation.z,
          angle: obj.rotation.angle,
        },
      });
    },
    sendSharedEvent(event): void {
      this.$socket.emit("SE", event.detail);
    },
    startSharedEvents(): void {
      let sharedZone;
      this.TYPES = {
        bool: {
          toJSON: (e) => e,
          fromJSON: (e) => e,
        },
        color: {
          toJSON: (color) => ({
            r: color.r,
            g: color.g,
            b: color.b,
          }),
          fromJSON: (color) => new X3D.SFColor(color.r, color.g, color.b),
        },
        float: {
          toJSON: (e) => e,
          fromJSON: (e) => e,
        },
        int32: {
          toJSON: (e) => e,
          fromJSON: (e) => e,
        },
        rotation: {
          toJSON: (rotation) => ({
            x: rotation.x,
            y: rotation.y,
            z: rotation.z,
            angle: rotation.angle,
          }),
          fromJSON: (rotation) =>
            new X3D.SFRotation(
              rotation.x,
              rotation.y,
              rotation.z,
              rotation.angle
            ),
        },
        string: {
          toJSON: (e) => e,
          fromJSON: (e) => e,
        },
        time: {
          toJSON: (e) => e,
          fromJSON: (e) => e,
        },
        vec2f: {
          toJSON: (vec2f) => ({ x: vec2f.x, y: vec2f.y }),
          fromJSON: (vec2f) => new X3D.SFVec2f(vec2f.x, vec2f.y),
        },
        vec3f: {
          toJSON: (vec3f) => ({
            x: vec3f.x,
            y: vec3f.y,
            z: vec3f.z,
          }),
          fromJSON: (vec3f) => new X3D.SFVec2f(vec3f.x, vec3f.y, vec3f.z),
        },
      };
      try {
        sharedZone = X3D.getBrowser().currentScene.getNamedNode("SharedZone");
      } catch (e) {
        return;
      }

      this.eventNodeMap = new Map();

      for (const eventNode of Array.from(sharedZone.events) as Array<any>) {
        for (const typeName of Object.keys(this.TYPES)) {
          eventNode.addFieldCallback(typeName + "ToServer", {}, val => {
            // TODO: confirm validity of adding to possibly non-existent field
            this.sendSharedEvent({
              detail: {
                name: eventNode.name,
                type: typeName,
                value: this.TYPES[typeName].toJSON(val),
              },
            });
          });
        }

        if (!this.eventNodeMap.has(eventNode.name)) {
          this.eventNodeMap.set(eventNode.name, []);
        }
        this.eventNodeMap.get(eventNode.name).push(eventNode);
      }
    },
    startSocketListeners(): void {
      this.$socket.on("AV", event => this.onAvatarMoved(event));
      this.$socket.on("AV:del", event => this.onAvatarRemoved(event));
      this.$socket.on("AV:new", event => this.onAvatarAdded(event));
      this.$socket.on("SE", event => this.onSharedEvent(event));
      this.$socket.on("VERSION", event => this.onVersion(event));
    },
    async startX3D(): Promise<any> {
      if (!this.browser) {
        this.browser = X3D.createBrowser();
        document.querySelector("#world").appendChild(this.browser);
      }
      const browser = X3D.getBrowser(this.browser);
      browser.loadURL(new X3D.MFString(this.worldUrl), "");
      return new Promise((resolve, reject) => {
        browser.addBrowserCallback({}, eventType => {
          switch (eventType) {
            case X3D.X3DConstants.INITIALIZED_EVENT:
              resolve(browser);
              break;
            case X3D.X3DConstants.CONNECTION_ERROR:
            case X3D.X3DConstants.INITIALIZED_ERROR:
              reject();
              break;
          }
        })
      })
    },
    startX3DListeners(browser: any): void {
      let browserProto = Object.getPrototypeOf(browser);
      let prox = browser.currentScene.createNode("ProximitySensor");
      prox.size = new X3D.SFVec3f(1000000, 1000000, 1000000);
      prox.enabled = true;
      prox.addFieldCallback("position_changed", {}, (val) => {
        this.position = [val.x, val.y, val.z];
      });
      prox.addFieldCallback("orientation_changed", {}, (val) => {
        this.rotation = [val.x, val.y, val.z, val.angle];
      });
      browser.currentScene.addRootNode(prox);
      if (!("viewpointPosition" in browserProto)) {
        Object.defineProperty(browserProto, "viewpointPosition", {
          get: function () {
            return prox.position_changed;
          },
        });
      }
      if (!("viewpointOrientation" in browserProto)) {
        Object.defineProperty(browserProto, "viewpointOrientation", {
          get: function () {
            return prox.orientation_changed;
          },
        });
      }
      browserProto.getTime = browserProto.getCurrentTime;

      //todo: shared objects
      this.sharedObjectsMap = new Map();
      this.sharedObjects.forEach((object) => {
        this.addSharedObject(object, browser);
      });

      this.startSharedEvents();

      this.loaded = true;
    },
  },
  computed: {
    worldUrl(): string {
      const { assets_dir, world_filename } = this.place;
      return `/assets/worlds/${assets_dir}${world_filename}`;
    },
  },
  watch: {
    "$store.data.x3dReady": function (to, from) {
      if (to && this.$route.name === "world-browser") {
        this.loadAndJoinPlace();
      }
    },
    "$store.data.view3d": function () {
      if (this.$route.name === "world-browser") {
        this.loadAndJoinPlace();
      }
    },

    $route(to, from) {
      if (to.name === "world-browser" && this.$store.data.x3dReady) {
        this.loadAndJoinPlace();
      } else if(from.name === "world-browser" && this.$store.data.x3dReady) {
        this.unloadPlace();
      }
    },
    place() {
      this.debugMsg("place changed");
    },
    position() {
      this.$socket.emit("AV", {
        pos: this.position,
      });
    },
    rotation() {
      this.$socket.emit("AV", {
        rot: this.rotation,
      });
    },
    sharedEvent: {
      handler() {
        if (this.sharedEvent) {
          this.$socket.emit("SE", this.sharedEvent.detail);
        }
      },
      deep: true,
      immediate: true,
    },
  },
  mounted() {
    this.startSocketListeners();
  },
  beforeDestroy() {},
  async beforeCreate() {
    await this.$socket.start();
  },
});
</script>

<style>
  .update-warning a {
    cursor: pointer;
  }
</style>
