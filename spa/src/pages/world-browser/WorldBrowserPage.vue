<template>
  <div class="h-full w-full bg-black flex flex-col">
    <div id="world" class="world w-full flex-1" style=""></div>
    <div class="flex flex-none h-1/3 bg-chat">
      <chat
        ref="chat"
        v-if="loaded"
        :place="place"
        :browser="browser"
        :position="position"
        :rotation="rotation"
        :shared-event="sharedEvent"
        :shared-objects="sharedObjects"
        @connected="isSocketConnected"
        @av-from-server-new="addAvatar"
        @av-from-server-del="removeAvatar"
        @av-from-server="avatarMovement"
        @se-from-server="handleSharedEvent"
        @move-object="moveObject"
      ></chat>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import * as worldDataJson from "../../libs/data/worlds.json";
import * as avatarsDataJson from "../../libs/data/avatars.json";

import Chat from "../../components/Chat.vue";
import { WorldBrowserData } from './world-browser-data.interface';

declare const X3D: any;

export default Vue.extend({
  name: "WorldBrowserPage",
  components: { Chat },
  data: (): WorldBrowserData => {
    return {
      debugLog: false,
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
    };
  },
  methods: {
    debugMsg(msg): void {
      if (this.debugLog) {
        console.log(msg);
      }
    },
    isSocketConnected(): void {
      this.debugMsg("is socket connected fired");
    },
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
    startX3D(): void {
      if (!this.browser) {
        this.browser = X3D.createBrowser();
        document.querySelector("#world").appendChild(this.browser);
      }
      X3D.getBrowser(this.browser)
        .loadURL(new X3D.MFString(this.worldUrl), "");
      this.startListeners();
    },
    startListeners(): void {
      this.debugMsg("start Listeners...");
      X3D.getBrowser().addBrowserCallback({}, (eventType) => {
        this.debugMsg("browser callback triggered");
        this.debugMsg(eventType);
        if (eventType === X3D.X3DConstants.INITIALIZED_EVENT) {
          this.debugMsg("initalized_event matched! " + this.place.name);
          this.debugMsg(this.place);
          let browser = X3D.getBrowser();
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
        }
      });
    },
    startSharedEvents(): void {
      // shared events code
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

      for (const eventNode of sharedZone.events) {
        for (const typeName of Object.keys(this.TYPES)) {
          eventNode.addFieldCallback(typeName + "ToServer", {}, val => {
            // TODO: confirm validity of adding to possibly non-existent field
            this.$refs.chat['sendSharedEvent']({
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
    handleSharedEvent(e): void {
      let eventObj = e.detail;
      for (let node of this.eventNodeMap.get(eventObj.name)) {
        node[eventObj.type + "FromServer"] = this.TYPES[eventObj.type].fromJSON(
          eventObj.value
        );
      }
    },
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
    async addAvatar(e): Promise<void> {
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

      var eventData = e.detail;
      if (!this.users[eventData.id]) {
        this.users[eventData.id] = {};
      }

      if (
        !this.users[eventData.id].loading &&
        !this.users[eventData.id].loaded
      ) {
        const { id, filename } = eventData.avatar;
        const avURL = `/assets/avatars/${id}/${filename}`;

        this.users[eventData.id].loading = true;
        loadInlineAsync(browser, avURL).then((avInline) => {
          let uniqueID = unique("Av-");
          browser.currentScene.updateImportedNode(avInline, "Avatar", uniqueID);
          var avImport = browser.currentScene.getImportedNode(uniqueID);
          browser.currentScene.addRootNode(avInline);
          this.users[eventData.id].loading = false;
          this.users[eventData.id].loaded = true;
          this.users[eventData.id]["inline"] = avInline;
          this.users[eventData.id]["import"] = avImport;

          if (this.users[eventData.id]["inline"]) {
            if (
              this.users[eventData.id].transform &&
              this.users[eventData.id].transform.pos
            ) {
              this.users[eventData.id]["import"].set_position = new X3D.SFVec3f(
                ...this.users[eventData.id].transform.pos
              );
            }
            if (
              this.users[eventData.id].transform &&
              this.users[eventData.id].transform.rot
            ) {
              this.users[eventData.id]["import"].rotation = ROTATE180.multiply(
                new X3D.SFRotation(...this.users[eventData.id].transform.rot)
              );
            }
          }
        });
      }
    },
    removeAvatar(e): void {
      const { id } = e.detail;

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
    avatarMovement(e): void {
      const ROTATE180 = new X3D.SFRotation(0, 1, 0, Math.PI);
      let eventData = e.detail;
      let browser = X3D.getBrowser(this.browser);

      if (!this.users[eventData.id]) {
        this.users[eventData.id] = {};
      }

      if (!this.users[eventData.id].transform) {
        this.users[eventData.id].transform = {};
      }

      if (eventData.pos) {
        this.users[eventData.id].transform.pos = eventData.pos;
      }
      if (eventData.rot) {
        this.users[eventData.id].transform.rot = eventData.rot;
      }

      if (this.users[eventData.id]["inline"]) {
        if (this.users[eventData.id].transform.pos) {
          this.users[eventData.id]["import"].set_position = new X3D.SFVec3f(
            ...this.users[eventData.id].transform.pos
          );
        }
        if (this.users[eventData.id].transform.rot) {
          this.users[eventData.id]["import"].rotation = ROTATE180.multiply(
            new X3D.SFRotation(...this.users[eventData.id].transform.rot)
          );
        }

        if (typeof eventData.gesture === "number") {
          this.users[eventData.id]["import"][
            "set_gesture" + eventData.gesture.toString()
          ] = browser.getCurrentTime();
        }
      }
    },
    moveObject(objectId): void {
      this.sharedObjectsMap.get(objectId).startMove = true;
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
  },
  computed: {
    worldUrl(): string {
      const { assets_dir, world_filename } = this.place;
      return `/assets/worlds/${assets_dir}${world_filename}`;
    },
  },
  watch: {
    "$store.data.x3dReady": function (to, from) {
      if (to === true && this.$route.name === "world-browser") {
        this.loaded = false;
        this.getPlace().then(() => {
          this.startX3D();
        });
      }
    },
    $route(to, from) {
      if (to.name === "world-browser" && this.$store.data.x3dReady) {
        this.loaded = false;
        this.getPlace().then(() => {
          this.startX3D();
        });
      }
    },
  },
  mounted() {},
  beforeDestroy() {},
});
</script>
