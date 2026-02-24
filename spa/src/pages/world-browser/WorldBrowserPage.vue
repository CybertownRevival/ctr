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
    <div id="world" class="world w-full flex-1" style="" v-show="this.$store.data.view3d && !force2d"></div>
    <div v-show="!this.$store.data.view3d || force2d" class="w-full flex-1">
      <component :is="mainComponent"></component>
    </div>
    <div class="flex flex-none h-1/3 bg-chat">
      <chat
        ref="chat"
        v-if="loaded"
        :place="place"
        :shared-event="sharedEvent"
        :shared-objects="sharedObjects"
        :clickId="clickId"
        @move-object="moveObject"
        @beam-to="beamTo"
        @drop-object="dropObject"
        @pickup-object="pickupObject"
        @add-pet="addPet"
        @pet-beam="beamPet"
      ></chat>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

import * as avatarsDataJson from "../../libs/data/avatars.json";
import * as worldDataJson from "../../libs/data/worlds.json";
import Chat from "../../components/Chat.vue";
import {
  debugMsg,
  environment,
} from "@/helpers";
import { WorldBrowserData } from "./world-browser-data.interface";

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
      force2d: false,
      pet: null,
      clickId: null,
    };
  },
  methods: {
    addPet(data): void {
      let userPosition = this.position;
      let userRotation = this.rotation;
      let distance = 5;
      const pos = new X3D.SFVec3f(...userPosition);
      const rot = new X3D.SFRotation(...userRotation);
      const pos_offset = rot.multVec(new X3D.SFVec3f(0-1.5, 0, -distance));
      pos_offset.y = 0;
      const newPosition = pos.add(pos_offset);
      const newOrientation = new X3D.SFRotation(0, 1, 0, Math.atan2(pos_offset.x, pos_offset.z));
      let petData = {
        url: data.url,
        name: data.name,
        id: data.id,
        position: newPosition,
        rotation: newOrientation,
      };
      setTimeout(() => {
        this.loadPetData(petData);
      }, 2000)
    },
    loadPetData(data) {
      const browser = X3D.getBrowser(this.browser);
      const pet = browser.currentScene.createProto("SharedObject");
      pet.name = data.name;
      pet.id = data.id;
      pet.translation = new X3D.SFVec3f(
        data.position.x,
        data.position.y,
        data.position.z,
      );
      pet.rotation = new X3D.SFRotation(
        data.rotation.x,
        data.rotation.y,
        data.rotation.z,
        data.rotation.angle + 3.15,
      );
      const inline = browser.currentScene.createNode("Inline");
      inline.url = new X3D.MFString(data.url);
      pet.children[0] = inline;
      browser.currentScene.addRootNode(pet);
      this.pet = pet;
    },
    beamPet(data){
      X3D.getBrowser(this.browser).currentScene.removeRootNode(this.pet);
      let userPosition = this.position;
      let userRotation = this.rotation;
      let distance = 4;
      const pos = new X3D.SFVec3f(...userPosition);
      const rot = new X3D.SFRotation(...userRotation);
      const pos_offset = rot.multVec(new X3D.SFVec3f(0, 0, -distance));
      pos_offset.y = 0;
      const newPosition = pos.add(pos_offset);
      const newOrientation = new X3D.SFRotation(0, 1, 0, Math.atan2(pos_offset.x, pos_offset.z));
      let petData = {
        url: data.url,
        name: data.name,
        id: data.id,
        position: newPosition,
        rotation: newOrientation,
      };
      this.loadPetData(petData);
    },
    addSharedObject(obj, browser): void {
      obj.url = `/assets/object/${obj.directory}/${obj.filename}`;
      if (obj.position == null) {
        obj.position = {
          x: 0,
          y: 0,
          z: 0,
        };
      } else {
        obj.position = JSON.parse(obj.position);
      }

      if (obj.rotation == null) {
        obj.rotation = {
          x: 0,
          y: 0,
          z: 0,
          angle: 0,
        };
      } else {
        obj.rotation = JSON.parse(obj.rotation);
      }

      const sharedObject = browser.currentScene.createProto("SharedObject");
      sharedObject.name = obj.name;
      sharedObject.id = obj.id;
      sharedObject.translation = new X3D.SFVec3f(
        obj.position.x,
        obj.position.y,
        obj.position.z,
      );
      sharedObject.rotation = new X3D.SFRotation(
        obj.rotation.x,
        obj.rotation.y,
        obj.rotation.z,
        obj.rotation.angle,
      );
      const inline = browser.currentScene.createNode("Inline");
      inline.url = new X3D.MFString(obj.url);
      sharedObject.children[0] = inline;
      browser.currentScene.addRootNode(sharedObject);
      sharedObject.addFieldCallback("newPosition", {}, (pos) => {
        this.saveObjectLocation(obj.id);
      });
      sharedObject.addFieldCallback("newRotation", {}, (rot) => {
        this.saveObjectLocation(obj.id);
      });
      sharedObject.addFieldCallback("touchTime", {}, (_t) => {
        if(obj.id){
          if(obj.id === this.clickId){
            this.clickId = null;
          } else {
            this.clickId = obj.id;
          }
        } else {
          this.clickId = null;
        }
      });
      this.sharedObjectsMap.set(obj.id, sharedObject);
    },
    debugMsg,
    async getPlace(): Promise<void> {
      this.debugMsg("get place");
      document.title = `${this.$store.data.place.name  } - Cybertown`;
      let objectResponse = null;
      this.sharedObjects = [];
      try {
        if(this.$store.data.place.type === "shop"){
          const objectResponse = await this.$http.get(`/mall/objects/${this.$store.data.place.id}`);
          objectResponse.data.objects.forEach(obj => {
            if(obj.status === 1){
              this.sharedObjects.push(obj);
            }
          });
        } else {
          objectResponse = await this.$http.get(`/place/${  this.$store.data.place.id 
          }/object_instance`);
          this.sharedObjects = objectResponse.data.object_instance;
        }
      } catch(e) {
        console.error(e);
      }
    },
    async loadAndJoinPlace(): Promise<void> {
      this.loaded = false;
      this.force2d = false;

      if (this.$store.data.place) this.$socket.leaveRoom(this.$store.data.place.id);
      await this.getPlace();

      if(this.$store.data.place.slug === "clubdir"){
        this.force2d = true;
      }

      if(this.$route.params.username){
        if(this.$store.data.place.assets_dir === null) {
          this.force2d = true;
        }
      }

      if(this.browser) {
        const browser = X3D.getBrowser(this.browser);
        browser.replaceWorld(null);
      }
      if(this.$store.data.view3d && !this.force2d) {
        const browser = await this.startX3D();
        this.loaded = true;
        this.startX3DListeners(browser);
      } else {

        if(this.$store.data.place.type === "shop"){
          this.mainComponent = () => import(
            "@/components/place/mall/main2d.vue"
          );
        } else if(this.$store.data.place.type === "club"){
          this.mainComponent = () => import(
            "@/components/place/club/main2d.vue"
          );
        } else {
          this.mainComponent = () => import(
            `@/components/place/${this.$store.data.place.slug}/main2d.vue`
          );
        }
        this.loaded = true;
      }
      this.joinPlace();
    },
    async unloadPlace(): Promise<void> {
      if (this.$store.data.place) this.$socket.leaveRoom(this.$store.data.place.id);
      const browser = X3D.getBrowser(this.browser);
      browser.replaceWorld(null);
    },
    async joinPlace(): Promise<void> {
      await this.$socket.joinRoom(this.$store.data.place.id, this.$store.data.user.token);
      this.debugMsg("joined room success", this.$store.data.place.id);
      if(this.$store.data.view3d){
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
      }
    },
    moveObject(objectId): void {
      this.sharedObjectsMap.get(objectId).startMove = true;
    },
    async dropObject(objectId): Promise<void> {
      const browser = X3D.getBrowser();
      const d = 4;
      const pos = new X3D.SFVec3f(...this.position);
      const rot = new X3D.SFRotation(...this.rotation);
      const pos_offset = rot.multVec(new X3D.SFVec3f(0, 0, -d));
      pos_offset.y = 0;
      const dropPosition = pos.add(pos_offset);
      const dropRotation= new X3D.SFRotation(0, 1, 0, Math.atan2(pos_offset.x, pos_offset.z));
      const request = await this.$http.post(`/object_instance/${  objectId  }/drop`, {
        placeId: this.$store.data.place.id,
        position: dropPosition._value,
        rotation: {
          x: dropRotation._value.x_,
          y: dropRotation._value.y_,
          z: dropRotation._value.z_,
          angle: dropRotation._value.angle + Math.PI,
        },
      });
      this.sharedObjects.push(request.data.object_instance);
      this.addSharedObject(request.data.object_instance, browser);
      this.$socket.emit("SO", {
        event: "add",
        objectId: objectId,
      });
    },
    async pickupObject(objectId): Promise<void> {
      // update db location
      await this.$http.post(`/object_instance/${  objectId  }/pickup`);

      // remove to the scene 
      if(this.$store.data.view3d) {
        const browser = X3D.getBrowser();
        const object = this.sharedObjectsMap.get(objectId);
        browser.currentScene.removeRootNode(object);
        this.sharedObjectsMap.delete(objectId);
      }
    
      this.sharedObjects = this.sharedObjects.filter(obj => obj.id != objectId);
      this.$socket.emit("SO", {
        event: "remove",
        objectId: objectId,
      });
    },
    beamTo(id): void {
      let target;
      let position;
      let rotation;
      let objectSelected = false;
      // Checks to see if the id only consists of numbers 
      // This identifies object_instance selection from user av selection.
      // Object_instance id's only use numbers while user av id's use letters and numbers.
      if(/^[0-9]+$/.test(id)){
        objectSelected = true;
        target = this.sharedObjectsMap.get(id);
        position = Object.values(target.translation._value);
        rotation = Object.values(Object.values(target.rotation._value));
        rotation.pop();
      } else {
        target = this.users[id];
        position = target.transform.pos;
        rotation = target.transform.rot;
      }
      if(target && position && rotation) {
        let distance;
        const browser = X3D.getBrowser(this.browser);
        if(!browser.currentScene) {
          return;
        }
        try {
          if(objectSelected === true){
            distance = browser.currentScene?.getNamedNode("SharedZone")?.beamToDistance ?? -4; 
          } else {
            distance = browser.currentScene?.getNamedNode("SharedZone")?.beamToDistance ?? 3;
          }
          
        } catch(e) {
          distance = 3;
        }
        const pos = new X3D.SFVec3f(...position);
        const rot = new X3D.SFRotation(...rotation);
        const pos_offset = rot.multVec(new X3D.SFVec3f(0, 0, -distance));
        pos_offset.y = 0;
        const viewpoint = browser.currentScene.createNode("Viewpoint");
        browser.currentScene.addRootNode(viewpoint);
        viewpoint.position = pos.add(pos_offset);
        // orientation math:
        // The destination avatar is, relative to us, at the negation of pos_offset
        // Math.atan2(y, x) gives the angle to face (x, y) if 0 angle is facing x
        // We want x = our -z to be 0 and y = our left = our -x. So, Math.atan(-x, -z)
        // Negating pos_offset gives Math.atan2(pos_offset.x, pos_offset.z)
        viewpoint.orientation = new X3D.SFRotation(0, 1, 0, Math.atan2(pos_offset.x, pos_offset.z));
        viewpoint.set_bind = true;
        viewpoint.addFieldCallback("isBound", {}, (value) => {
          if(!value) {
            browser.currentScene.removeRootNode(viewpoint);
            viewpoint.dispose();
          }
        });
      }
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
        const inline = browser.currentScene.createNode("Inline");
        inline.url = new X3D.MFString(url);
        const loadSensor = browser.currentScene.createNode("LoadSensor");
        loadSensor.watchList[0] = inline;
        const callbackKey = {};
        const promise = new Promise((resolve, reject) => {
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

      const browser = X3D.getBrowser(this.browser);

      if (!this.users[event.id]) {
        this.users[event.id] = {};
      }

      if (
        !this.users[event.id].loading &&
        !this.users[event.id].loaded
      ) {
        const { directory, filename } = event.avatar;
        const avURL = `/assets/avatars/${directory}/${filename}`;

        this.users[event.id].loading = true;
        loadInlineAsync(browser, avURL).then((avInline) => {
          const uniqueID = unique("Av-");
          browser.currentScene.updateImportedNode(avInline, "Avatar", uniqueID);
          const avImport = browser.currentScene.getImportedNode(uniqueID);
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
                ...this.users[event.id].transform.pos,
              );
            }
            if (
              this.users[event.id].transform &&
              this.users[event.id].transform.rot
            ) {
              this.users[event.id]["import"].rotation = ROTATE180.multiply(
                new X3D.SFRotation(...this.users[event.id].transform.rot),
              );
            }
          }
        });
      }
    },
    onAvatarMoved(event): void {
      const ROTATE180 = new X3D.SFRotation(0, 1, 0, Math.PI);
      const browser = X3D.getBrowser(this.browser);

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
            ...this.users[event.id].transform.pos,
          );
        }
        if (this.users[event.id].transform.rot) {
          this.users[event.id]["import"].rotation = ROTATE180.multiply(
            new X3D.SFRotation(...this.users[event.id].transform.rot),
          );
        }

        if (typeof event.gesture === "number") {
          this.users[event.id]["import"][
            `set_gesture${  event.gesture.toString()}`
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
      for (const node of this.eventNodeMap.get(event.name)) {
        node[`${event.type  }FromServer`] = this.TYPES[event.type].fromJSON(
          event.value,
        );
      }
    },
    async onSharedObjectEvent(event): Promise<void> {
      if(this.$store.data.view3d){
        const browser = X3D.getBrowser();
        this.sharedObjects.forEach(sharedObject => {
          const object = this.sharedObjectsMap.get(sharedObject.id);
          browser.currentScene.removeRootNode(object);
          this.sharedObjectsMap.delete(sharedObject.id);
        });
        this.sharedObjects = [];
        const objectInstanceResponse = await this.$http.get(`/place/${  this.$store.data.place.id 
        }/object_instance`);
        this.sharedObjects = objectInstanceResponse.data.object_instance;
        this.sharedObjectsMap = new Map();
        this.sharedObjects.forEach((object) => {
          this.addSharedObject(object, browser);
        });
      } else {
        this.sharedObjects = [];
        const objectInstanceResponse = await this.$http.get(`/place/${  this.$store.data.place.id 
        }/object_instance`);
        this.sharedObjects = objectInstanceResponse.data.object_instance;
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
    async saveObjectLocation(objectId): Promise<void> {
      const obj = this.sharedObjectsMap.get(objectId);
      const location = {
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

      };
      if(this.$store.data.place.type === "shop"){
        await this.$http.post(`/mall/${  objectId  }/position`, location);
        /*
        /* This crashes the server.
        /*
        this.$socket.emit('SO', {
          event: 'move',
          objectId: objectId,
          detail: location
        });*/
      } else {
        await this.$http.post(`/object_instance/${  objectId  }/position`, location);
        this.$socket.emit("SO", {
          event: "move",
          objectId: objectId,
          detail: location,
        });
      }
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
              rotation.angle,
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

      for (const eventNode of Array.from<any>(sharedZone.events)) {
        for (const typeName of Object.keys(this.TYPES)) {
          eventNode.addFieldCallback(`${typeName  }ToServer`, {}, val => {
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
    async updateObject(object){
      const alteredSharedObjects = [];
      
      // Gets updated information for the object
      const updatedObject = await this.$http.get(`/object_instance/${ object.obj_id }/properties/`);
      const objectId = updatedObject.data.objectInstance[0].id;

      // Updates object list if the object is still in the same place
      // Removes the object if it is not in the same place
      if(updatedObject.data.objectInstance[0].place_id === this.$store.data.place.id){
        
        // Populates altered objects array with updated information
        this.sharedObjects.forEach((obj) => {
          if(obj.id === parseInt(object.obj_id) &&
            obj.place_id === this.$store.data.place.id){
            obj = updatedObject.data.objectInstance[0];
          }
          if(obj.place_id === this.$store.data.place.id){
            alteredSharedObjects.push(obj);
          }
        });
        this.sharedObjects = alteredSharedObjects;
      } else {
        this.sharedObjects = this.sharedObjects.filter(obj => {
          return obj.id !== parseInt(object.obj_id);
        });
        if(this.$store.data.view3d){
          const browser = X3D.getBrowser();
          const removeObject = this.sharedObjectsMap.get(objectId);
          browser.currentScene.removeRootNode(removeObject);
        }
        this.sharedObjectsMap.delete(objectId);
        this.$socket.emit("SO", {
          event: "remove",
          objectId: objectId,
        });
      }
    },
    startSocketListeners(): void {
      this.$socket.on("VERSION", event => this.onVersion(event));
      this.$socket.on("update-object", (object) => {
        if(object.place_id === this.$store.data.place.id){
          this.updateObject(object);
        }
      });
      this.$socket.on("SO", event => this.onSharedObjectEvent(event));
    },
    start3DSocketListeners(): void {
      this.$socket.on("AV", event => this.onAvatarMoved(event));
      this.$socket.on("AV:del", event => this.onAvatarRemoved(event));
      this.$socket.on("AV:new", event => this.onAvatarAdded(event));
      this.$socket.on("SE", event => this.onSharedEvent(event));
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
        });
      });
    },
    startX3DListeners(browserbak: any): void {
      const browser = X3D.getBrowser();
      const browserProto = Object.getPrototypeOf(browser);
      const prox = browser.currentScene.createNode("ProximitySensor");
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
      this.sharedObjectsMap = new Map();
      setTimeout(() => {
        //this.sharedObjectsMap = new Map();
        this.sharedObjects.forEach((object) => {
          this.addSharedObject(object, browser);
        });
      }, 2000);

      this.startSharedEvents();
      this.start3DSocketListeners();
      this.loaded = true;
    },
  },
  computed: {
    worldUrl(): string {
      const { assets_dir, world_filename } = this.$store.data.place;
      return `/assets/worlds/${assets_dir}${world_filename}`;
    },
  },
  watch: {
    "$store.data.x3dReady": function (to, from) {
      if (to && (this.$route.name === "world-browser" || this.$route.name === "user-home" || 
          to.name === "club-page")) {
        this.loadAndJoinPlace();
      }
    },
    "$store.data.view3d": function () {
      if (this.$route.name === "world-browser" || this.$route.name === "user-home"
          || this.$route.name === "club-page" && this.$store.data.x3dReady) {
        this.loadAndJoinPlace();
      }
    },

    $route(to, from) {
      if (
        (to.name === "world-browser" || to.name === "user-home" || to.name === "club-page")
        && this.$store.data.x3dReady
      ) {
        this.loadAndJoinPlace();
      } else if(
        (from.name === "world-browser" || from.name === "user-home" || from.name === "club-page")
        && this.$store.data.x3dReady
      ) {
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
