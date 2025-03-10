<template>
  <div class="flex flex-row chat space-x-1 p-1 text-chat w-full">
    <div class="messages-pane flex flex-col flex-1">
      <div class="flex-grow p-1 overflow-y-auto h-full" ref="chatArea">
        <ul class="text-base">
          <li v-for="(msg, key) in messages" :key="key">
            <i v-if="msg.new !== true && msg.type !== 'system'" class="text-white">
              {{ msg.username }}: {{ msg.msg }}
            </i>
            <strong
              v-if="msg.msg && msg.type === 'system'"
              class="text-white">
              {{ msg.msg }}
            </strong>
            <strong
              v-else-if="msg.type && msg.type === 'system'"
              class="text-white">
              {{ msg.time }}
            </strong>
            <span 
              v-else-if="msg.username === $store.data.user.username && msg.new === true && !msg.whisper"
              style="color:#FFFF00;">
              <sup class="inline" v-if="showRole" v-show="msg.role">{{ msg.role }}</sup>
              {{ msg.username }}
              <sub class="inline" v-if="showXP">{{ msg.exp }}</sub> : 
              <span class="font-normal">{{ msg.msg }}</span>
            </span>
            <span 
              v-else-if="(msg.username === $store.data.user.username ||
                msg.from !== $store.data.user.username
              ) && msg.whisper"
              class="italic" style="color: #00C3FF;">
              {{ msg.from }} whispered you
              <span style="font-style: normal;">{{ msg.msg }}</span>
            </span>
            <span 
              v-else-if="
              msg.username !== $store.data.user.username && 
              msg.from === $store.data.user.username && msg.whisper"
              class="italic" style="color: #00C3FF;">
              You whispered {{ msg.username }} 
              <span style="font-style: normal;">{{ msg.msg }}</span>
            </span>
            <span class="font-bold"  v-else-if="msg.new === true">
              <sup class="inline" v-if="showRole" v-show="msg.role">{{ msg.role }}</sup>
              {{ msg.username }}
              <sub class="inline" v-if="showXP">{{ msg.exp }}</sub> : 
              <span class="font-normal">{{ msg.msg }}</span>
            </span>
          </li>
        </ul>
      </div>
      <div class="flex flex-none flex-row space-x-0.5 bg-black" v-show="chatEnabled">
        <input
          type="text"
          v-model="message"
          class="flex-grow p-0.5 text-black"
          @keyup.exact.enter="sendMessage"
          maxlength="255"
          v-focus
        />
        <button
          type="button"
          class="
            flex-none
            p-1
            bg-gray-300
            text-black
            hover:bg-gray-200
            active:bg-gray-400
          "
          @click="sendMessage"
        >
          Send
        </button>
      </div>
    </div>
    <div class="flex flex-none flex-col w-60 space-0.5 bg-black text-base">
      <div
        class="
          flex flex-none
          p-1
          messages-pane
          text-yellow-200 text-center
          font-bold
        "
      >
        <span v-if="activePanel === 'users'" class="flex-grow">
          ({{ this.users.length + 1 }}) {{ this.$store.data.place.name }}
        </span>
        <span v-if="activePanel === 'places'" class="flex-grow">
          ({{ this.activePlaces.length }}) Places
        </span>
        <span v-if="activePanel === 'gestures'" class="flex-grow">
          Body Language
        </span>
        <span v-if="activePanel === 'sharedObjects'" class="flex-grow">
          ({{  this.sharedObjects.length }}) Objects
        </span>
        <span v-if="activePanel === 'backpack'" class="flex-grow">
          ({{  this.backpackObjects.length }}) My Backpack
        </span>
        <span v-if="activePanel === 'userBackpack'" class="flex-grow">
          ({{ this.backpackObjects.length }}) {{ this.usernameBackPack }}'s Backpack
        </span>
        <button
          type="button"
          class="
            flex-none
            p-0.5
            bg-gray-300
            text-black
            hover:bg-gray-200
            active:bg-gray-400
          "
          @click="changeActivePanel"
          v-show="chatEnabled"
        >
          Next
        </button>
      </div>
      <div class="flex-grow overflow-y-auto p-1 messages-pane">
        <ul v-if="activePanel === 'users'">
          <li class="text-white" v-if="virtualPet">
            <img src="/assets/img/av_bot.gif" class="inline" />
            {{ virtualPet.pet_name }}
          </li>
          <li class="text-white" @click="handler($event)" @contextmenu="handler($event)" @mouseup="menu($store.data.user.id)">
            <img src="/assets/img/av_me.gif" class="inline" />
            {{ this.$store.data.user.username }}
          </li>
          <li class="cursor-default" v-for="(user, key) in users" :key="key" @click="handler($event)" @contextmenu="handler($event)" @mouseup="menu(user.id, user.username)">
            <img src="/assets/img/av_mute.gif" class="inline" v-if="blockedMembers.includes(user.username) === true" />
            <img src="/assets/img/av_def.gif" class="inline" v-else-if="worldMembers.includes(user.username) === true" />
            <img src="/assets/img/av_invis.gif" class="inline" v-else />
            {{ user.username }}
          </li>
        </ul>
        <ul v-if="activePanel === 'gestures'">
          <li
            v-for="(gesture, key) in this.$store.data.user.avatar.gestures"
            :key="key"
            @click="sendGesture(key)"
            class="cursor-pointer hover:bg-gray-200 active:bg-gray-400"
          >
            {{ gesture }}
          </li>
        </ul>
        <ul v-if="activePanel === 'places'">
          <li
            v-for="(places, key) in activePlaces"
            :key="key"
            class="cursor-pointer"
            @click="handler($event)" @contextmenu="handler($event)"
          >
          <div @mouseup="menu(places.type, places.username, places.slug, places.place_id)">{{ places.name }} ({{ places.count }})</div>  
          </li>
        </ul>
        <ul v-if="activePanel === 'sharedObjects'">
          <li
            v-for="object in sharedObjects"
            :key="object.id"
            class="flex cursor-default"
            @click="handler($event)" @contextmenu="handler($event)"
          >
            <div v-if="object.object_name && object.object_name !== ''" class="flex-1 whitespace-nowrap overflow-x-hidden" @mouseup="menu(object.id,  object.member_id, object.object_price)">
              {{ object.object_name }}
            </div>
            <div v-else-if="$store.data.place.type === 'shop'" class="flex-1 whitespace-nowrap overflow-x-hidden" @mouseup="menu(object.id, $store.data.place.type)">
              {{ object.name }}
            </div>
            <div v-else class="flex-1 whitespace-nowrap overflow-x-hidden" @mouseup="menu(object.id,  object.member_id, object.object_price)">
              {{ object.name }}
            </div>
          </li>
        </ul>
        <ul v-if="activePanel === 'backpack' || activePanel === 'userBackpack'">
          <li
            v-for="object in backpackObjects"
            :key="object.id"
            class="flex cursor-default"
            @click="handler($event)" @contextmenu="handler($event)"
          >
            <div v-if="object.object_name !== ''" class="flex-1 whitespace-nowrap overflow-x-hidden" @mouseup="menu(object.id, object.object_price)">
              {{ object.object_name }}
            </div>
            <div v-else class="flex-1 whitespace-nowrap overflow-x-hidden" @mouseup="menu(object.id, object.object_price)">
              {{ object.name }}
            </div>
          </li>

        </ul>
      </div>
    </div>
    <div v-show="userMenu" 
      class="
        absolute
        flex-none
        w-40
        text-black
        bg-gray-300
        cursor-pointer
        cls-context-menu
      " 
      style="border: outset #EEE;" 
      :style="{left: menuLeft, top: menuTop, bottom: menuBottom}"
      @mouseleave="closeMenu()"
    >
      <ul>
        <li 
          class="
            p-1
            pl-3.5
            hover:text-white 
            hover:bg-gray-500
            active:bg-gray-400
          "
          @click="closeMenu()">
          Close Menu
        </li>
        <li style="border: inset #EEE 3px;"></li>
        <li v-show="menuGoTo" 
          class="
            p-1
            pl-3.5
            hover:text-white 
            hover:bg-gray-500
            active:bg-gray-400
          "
          @click="goToPlace()">
          Go to
        </li>
        <li v-show="menuToggleRole" 
          class="
            p-1
            pl-3.5
            hover:text-white 
            hover:bg-gray-500
            active:bg-gray-400
          "
          >
          <input type="checkbox" id="role" v-model="showRole" />
          <label for="role"> Users Roles</label>
        </li>
        <li v-show="menuToggleXP" 
          class="
            p-1
            pl-3.5
            hover:text-white 
            hover:bg-gray-500
            active:bg-gray-400
          "
          >
          <input type="checkbox" id="XP" v-model="showXP" />
          <label for="XP"> Users XP</label>
        </li>
        <li v-show="menuToggleSpeech" 
          class="
            p-1
            pl-3.5
            hover:text-white 
            hover:bg-gray-500
            active:bg-gray-400
          "
          >
          <input type="checkbox" id="speech" v-model="tts" />
          <label for="speech"> Text To Speech</label>
        </li>
        <li v-show="menuBeamTo" 
          class="
            p-1
            pl-3.5
            hover:text-white 
            hover:bg-gray-500
            active:bg-gray-400
          "
          @click="beamTo()">
          Beam to
        </li>
        <li v-show="menuWhisper" 
          class="
            p-1
            pl-3.5
            text-gray-500
            hover:text-white 
            hover:bg-gray-500
            active:bg-gray-400
          "
        >
          Start Whisper
        </li>
        <li v-show="menuInviteChat" 
          class="
            p-1
            pl-3.5
            text-gray-500
            hover:text-white 
            hover:bg-gray-500
            active:bg-gray-400
          "
        >
          Invite Chat
        </li>
        <li v-show="menuIgnore" 
          class="
            p-1
            pl-3.5
            hover:text-white 
            hover:bg-gray-500
            active:bg-gray-400
          "
          @click="blockMember()"
        >
          Ignore
        </li>
        <li v-show="menuBuy" 
          class="
            p-1
            pl-3.5
            hover:text-white 
            hover:bg-gray-500
            active:bg-gray-400
          "
          @click="objectOpener()"
        >
          Buy
        </li>
        <li v-show="menuMove" 
          class="
            p-1
            pl-3.5
            hover:text-white 
            hover:bg-gray-500
            active:bg-gray-400
          " 
          @click="moveObject()"
        >
          Move
        </li>
        <li v-show="menuTake" 
          class="
            p-1
            pl-3.5
            hover:text-white 
            hover:bg-gray-500
            active:bg-gray-400
          "
          @click="pickUpObject()"
        >
          Take
        </li>
        <li v-show="menuDrop" 
          class="
            p-1
            pl-3.5
            hover:text-white 
            hover:bg-gray-500
            active:bg-gray-400
          " 
          @click="dropObject()"
        >
          Drop
        </li>
        <li v-show="menuDestroy" 
          class="
            p-1
            pl-3.5
            text-gray-500
            hover:text-white 
            hover:bg-gray-500
            active:bg-gray-400
          "
        >
          Destroy
        </li>
        <li v-show="menuProperties" 
          class="
            p-1
            pl-3.5
            hover:text-white 
            hover:bg-gray-500
            active:bg-gray-400
          "
          v-on:click="objectOpener()"
        >
          Properties
        </li>
        <li v-if="menuRequestBackpack && activePanel === 'users'" style="border:inset #EEE 3px;"></li>
        <li v-show="menuRequestBackpack" 
          class="
            p-1
            pl-3.5
            hover:text-white 
            hover:bg-gray-500
            active:bg-gray-400
          "
          @click="userBackpack()"
        >
          Request Objects
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">

import Vue from 'vue';
import { debugMsg } from '@/helpers';
export default Vue.extend({
  name: "Chat",
  props: [
    "place",
    "sharedEvent",
    "sharedObjects",
  ],
  data: () => {
    return {
      message: "",
      messages: [],
      users: [],
      backpackObjects: [],
      primaryRole: "",
      displayRole: true,
      xpAmount: 0,
      activePanel: "users",
      objectId: null,
      canInteractWithObject: false,
      canModify: false,
      memberId: null,
      username: null,
      usernameBackPack: null,
      blockedUser: false,
      blockedMembers: [],
      cursorX: null,
      cursorY: null,
      numberOfPosts: 0,
      userMenu: false,
      menuTop: null,
      menuLeft: null,
      menuBottom: null,
      menuBeamTo: true,
      menuWhisper: true,
      menuInviteChat: true,
      menuIgnore: true,
      menuDrop: false,
      menuMove: false,
      menuTake: false,
      menuBuy: false,
      menuDestroy: false,
      menuProperties: false,
      menuRequestBackpack: true,
      menuGoTo: false,
      menuToggleRole: false,
      menuToggleXP: false,
      menuToggleSpeech: false,
      mallObject: false,
      activePlaces: [],
      placeList: [],
      placeType: null,
      placeUsername: null,
      placeSlug: null,
      placeId: null,
      chatIntervalId: null,
      pingIntervalId: null,
      worldMembers: [],
      chatEnabled: false,
      showRole: true,
      showXP: true,
      tts: false,
      virtualPet: null,
      virtualPetDirectly: [],
      virtualPetWhisper: [],
      virtualPetBeam: [],
      virtualPetMessageData: [],
      virtualPetInputs: [[],[],[],],
      virtualPetOutputs: [[],[],[],],
      virtualPetDefault: [],
      entryMessageCode: new Date().getTime(),
    };
  },
  directives: {
    focus: {
      inserted: function (el) {
        el.focus()
      }
    }
  },
  methods: {
    handler: function(e) {
      this.userMenu = true;
      this.cursorX = e.x;
      this.cursorY = e.y;
      if(this.cursorY >= window.innerHeight - 150){
        this.menuTop = null;
        this.menuBottom = "5px";
      }
      else{
        this.menuBottom = null;
        this.menuTop = this.cursorY - 15 + "px";
      }
      if(this.cursorX >= window.innerWidth - 115){
        this.menuLeft = this.cursorX - 115 + "px";
      }
      else{
        this.menuLeft = this.cursorX - 15 + "px";
      }
      e.preventDefault();
    },
    async getRole(): Promise<void> {
      const response = await this.$http.get("/member/getrolename");
      if(response.data.PrimaryRoleName.length === 0 ){
        this.primaryRole = "";
      } else {
        this.primaryRole = response.data.PrimaryRoleName[0].name;
      }
    },
    async getXpAmount(){
      const info = await this.$http.get('/member/info');
      this.xpAmount = info.data.memberInfo.xp;
    },
    debugMsg,
    async sendMessage(): Promise <void> {
      this.debugMsg("sending message...");

      //Limits the length of a single word allowed
      const maxWordLength = 24;
      this.message.split(" ").map(word => {
        if(word.length > maxWordLength){
          this.message = "";
          alert ("Please do not try to flood the chat with long words!");
          }
        }
      )

      //Limits the amount of posts allowed within a rolling 30 seconds
      const maxPosts = 7;
      const postInterval = .5;
      if(this.message !== ""){
        if(this.numberOfPosts === 0 || this.numberOfPosts <= maxPosts - 1){
            setTimeout(() => this.numberOfPosts = --this.numberOfPosts, postInterval * 60 * 1000);
          }
          else{
            alert ("Chat has been temporarily disabled. Please do not flood the chat!");
            this.message = "";
          }
        }

        if (this.message !== "" && this.connected && this.numberOfPosts < maxPosts) {
        let msgID = null;
        await this.$http
          .post("/message/place/" + this.$store.data.place.id, {
            body: this.message,
          })
          .then((response) => {
            //this.debugMsg(response.data);
            msgID = response.data.messageId;
            if(this.displayRole){
              this.$socket.emit("CHAT", {
                msg: this.message,
                role: this.primaryRole,
                exp: this.xpAmount,
                msg_id: msgID,
              });
            } else {
              this.$socket.emit("CHAT", {
                msg: this.message,
                exp: this.xpAmount,
                msg_id: msgID,
              });
            }
          });
        this.numberOfPosts = ++this.numberOfPosts;
        this.message = "";
      }
    },
    async getActivePlaces() {
      this.activePlaces = [];
      const places = await this.$http.get('/member/places');
      places.data.forEach(place => {
        this.activePlaces.push(place);
      });
      this.activePlaces.sort((a, b) => a.count - b.count).reverse(); 
    },
    pingActive(){
      this.$http.post('/member/ping');
    },
    systemMessage(msg: string): void {
      this.messages.push({
        type: "system",
        msg: msg,
        time: new Date().toLocaleTimeString("en-US", {timeZone: "America/New_York"}),
      });
    },
    async goToPlace(){
      if(
        this.placeType === 'public' || 
        this.placeType === 'shop' ||
        this.placeType === 'colony'
      ){
        window.location.assign(`#/place/${this.placeSlug}`);
      }
      if(this.placeType === 'home'){
        window.location.assign(`#/home/${this.placeUsername}`);
      }
      if(this.placeType === 'hood'){
        window.location.assign(`#/neighborhood/${this.placeId}`);
      }
      if(this.placeType === 'club'){
        window.location.assign(`#/club/${this.placeId}`);
      }
    },
    async menu(...target){
      this.menuBeamTo = false;
      this.menuWhisper = false;
      this.menuInviteChat = false;
      this.menuIgnore = false;
      this.menuDrop = false;
      this.menuMove = false;
      this.menuTake = false;
      this.menuBuy = false;
      this.menuDestroy = false;
      this.menuProperties = false;
      this.menuRequestBackpack = false;
      this.menuGoTo = false;
      this.menuToggleRole = false;
      this.menuToggleXP = false;
      this.menuToggleSpeech = false;
      this.mallObject = false;
      this.placeType = null;
      this.placeUsername = null;
      this.placeSlug = null;
      this.placeId = null;

      this.objectId = target[0];
      if(this.activePanel === 'users'){
        this.memberId = null;
        this.username = target[1];
      }

      if(this.activePanel === 'places'){
        this.placeType = target[0];
        if(this.placeType === 'home'){
          this.placeUsername = target[1];
        }
        if(
          this.placeType === 'public' || 
          this.placeType === 'shop' ||
          this.placeType === 'colony' 
        ){
          this.placeSlug = target[2];
        }   
        if(this.placeType === 'hood' ||
          this.placeType === 'club'
        ){
          this.placeId = target[3];
        }    
      }

      if(this.activePanel === 'sharedObjects'){
        this.username = null;
        this.memberId = target[1];
      }
      
      if(target[1] === 'shop'){
        this.mallObject = true;
      }

      //User Panel
      if(this.activePanel === 'users'){
        if(target[0] === this.$store.data.user.id){
          this.menuToggleRole = true;
          this.menuToggleXP = true;
          this.menuToggleSpeech = true;
        } else {
          this.menuIgnore = true;
          this.menuInviteChat = true;
          this.menuRequestBackpack = true;
          this.menuWhisper = true;
          if(this.$store.data.view3d){
            this.menuBeamTo = true;
          }
        }
      }

      //Places Panel
      if(this.activePanel === 'places'){
        this.menuGoTo = true;
      }

      //Public Objects Panel
      if(this.activePanel === 'sharedObjects'){
        this.menuProperties = true;
        if(target[2] !== null && this.memberId !== this.$store.data.user.id){
          this.menuBuy = true;
        }
        if(this.memberId === this.$store.data.user.id){
          this.menuDestroy = true;
        }
        if(this.canModify && this.$store.data.place.type !== 'shop' ||
          this.memberId === this.$store.data.user.id
        ){
          this.menuTake = true;
        }
        if(this.$store.data.view3d){
          this.menuBeamTo = true;
          if(
            this.$store.data.user.id === this.memberId ||
            this.canModify
          ){
            this.menuMove = true;
          }
        }
      }

      //My Backpack Panel
      if(this.activePanel === 'backpack'){
        this.menuProperties = true;
        this.menuDestroy = true;
        if(
          this.$store.data.view3d &&
          (
            this.$store.data.place.slug === 'fleamarket' || 
            this.$store.data.place.member_id === this.$store.data.user.id
          )){
            this.menuDrop = true;
            this.menuProperties = true;
          }
        }

        //User Backpack Panel
        if(this.activePanel === 'userBackpack'){
          this.menuProperties = true;
          if(target[1] !== null && this.memberId !== this.$store.data.user.id){
          this.menuBuy = true;
        }
        }
    },
    async canAdmin(){
      let admin = null;
      if(this.$store.data.place.slug === 'mall' || this.$store.data.place.type === 'shop'){
        admin = await this.$http.get("/mall/can_admin", {
          'id': this.$store.data.user.id
        });
      }
      if(this.$store.data.place.slug === 'fleamarket'){
        admin = await this.$http.get("/fleamarket/can_admin", {
          'id': this.$store.data.user.id
        });
      }
      if(admin && admin.data.status === 'success'){
        this.canModify = true;
        if(this.$store.data.view3d){
          this.canInteractWithObject = true;
        }
      } 
    },
    closeMenu(){
      this.userMenu = false;
    },
    objectOpener() {
      this.closeMenu();
      if(this.mallObject){
        window.open("/#/mall/object/"+this.objectId, "targetWindow", "width=1000px,height=700px,location=0,menubar=0,status=0,scrollbars=0");
      } else {
        window.open("/#/object/"+this.objectId, "targetWindow", "width=1000px,height=700px,location=0,menubar=0,status=0,scrollbars=0");
      }
    },
    async joinedChat() {
      let userIs3D = 0;
      if(this.$store.data.view3d){
        userIs3D = 1;
      }
      await this.$http.post('/member/joined', {
        place_id: this.$store.data.place.id,
        is_3d: userIs3D
      })
    },
    startNewChat(): void {
      this.messages = [];
      this.users = [];
      this.canInteractWithObject = false;
      if(this.$store.data.place.member_id === this.$store.data.user.id) {
        this.canModify = true;
        if(this.$store.data.view3d){
          this.canInteractWithObject = true;
        }
      }
      this.$http
        .get(`/message/place/${this.$store.data.place.id}`, {
          limit: 10,
          order: "id",
          orderDirection: "desc",
        })
        .then((response) => {
          this.messages = response.data.messages.reverse();
          this.systemMessage("Welcome to " + this.$store.data.place.name);
          this.getVirtualPet();
        });
    },
    async getVirtualPet(){
      const checkPet = await this.$http.get(`/place/virtual-pet/${this.$store.data.place.id}`);
      if(checkPet.data.data.length === 1 &&
        checkPet.data.data[0].active
      ){
        this.virtualPet = checkPet.data.data[0];
        this.virtualPetDefault = [
          "Go on...",
          "I'm listening...",
          "What?",
        ];
        JSON.parse(this.virtualPet.pet_behaviours).forEach((response) => {
          this.virtualPetDirectly.push(response.directly);
          this.virtualPetWhisper.push(response.whisper);
          this.virtualPetBeam.push(response.beam);
          this.virtualPetMessageData.push(response.output);
          if(response.match === 'exact'){
            this.virtualPetInputs[0].push(response.input)
            this.virtualPetOutputs[0].push(response.output)
          }
          if(response.match === 'and'){
            this.virtualPetInputs[1].push(response.input)
            this.virtualPetOutputs[1].push(response.output)
          }
          if(response.match === 'or'){
            this.virtualPetInputs[2].push(response.input)
            this.virtualPetOutputs[2].push(response.output)
          }
        });
        this.checkForEntryMessage();
        if(this.$store.data.view3d){
          this.$emit('add-pet', {
            url: this.virtualPet.pet_avatar_url,
            name: this.virtualPet.pet_name,
            id: this.virtualPet.id,
          });
        }
      } else {
        this.virtualPet = null;
      }
    },
    changeActivePanel(): void {
      this.backpackObjects = [];
      switch (this.activePanel) {
        case "users":
          this.activePanel = "gestures";
          break;
        case "gestures":
          this.activePanel = 'places';
          break;
        case "places":
          this.activePanel = "sharedObjects";
          break;
        case "sharedObjects":
          this.activePanel = "backpack";
          break;
          case "backpack":
          this.activePanel = "users";
          break;
          case "userBackpack":
          this.activePanel = "users";
          break;
      }
    },
    sendGesture(gestureIndex): void {
      this.$socket.emit("AV", {
        gesture: gestureIndex + 1, // Gestures in ssts start at 1 for some reason.
      });
    },
    moveObject(): void {
      this.$emit("move-object", this.objectId);
      this.closeMenu();
    },
    beamTo(): void {
      this.$emit("beam-to", this.objectId);
      this.closeMenu();
    },
    blockMember(){
      if(this.blockedMembers.includes(this.username) === true){
        let index = this.blockedMembers.indexOf(this.username);
        if(index !== -1){
          this.blockedMembers.splice(index, 1);
          this.systemMessage(`You have unblocked ${this.username}`);
        }
      } else {
        this.blockedMembers.push(this.username);
        this.systemMessage(`You have blocked ${this.username}`);
      }
      this.closeMenu();
    },
    async isMember3D(user){
      const check3D = await this.$http.get(`/member/check3d/${user.username}`);
        if(check3D.data.user3d[0].is_3d === 1){
          this.worldMembers.push(user.username);
        }
      },
    async updateObjectLists(object){
      let alteredBackpack = [];
      if(['backpack', 'userBackpack'].includes(this.activePanel)){

        // Gets updated information for the object
        const updatedObject = await this.$http.get(`/object_instance/${ object.obj_id }/properties/`);
        if(this.activePanel === 'backpack' && 
          object.place_id === 0 && 
          [object.member_username, object.buyer_username].includes(this.$store.data.user.username)){
         
          // Checks if the object was purchased by current user
          // and adds it to the backpack array
          if(object.buyer_username === this.$store.data.user.username &&
            object.member_username !== object.buyer_username){
            this.backpackObjects.push(updatedObject.data.objectInstance[0]);
          }
          
          // Populates altered objects array with updated information
          this.backpackObjects.forEach((obj) => {
            if(obj.id === parseInt(object.obj_id)){
              obj = updatedObject.data.objectInstance[0]
            }
            if(obj.member_id === this.$store.data.user.id){
              alteredBackpack.push(obj)
            }
          })
          this.backpackObjects = alteredBackpack;
        }
        if(this.activePanel === 'userBackpack' && 
          object.place_id === 0 && 
          [object.member_username, object.buyer_username].includes(this.username)){
          
          // Checks if the object was purchased by the selected user
          // and adds it to the backpack array
          if(object.buyer_username === this.username &&
            object.member_username !== object.buyer_username){
            this.backpackObjects.push(updatedObject.data.objectInstance[0]);
          }
          
          // Populates altered objects array with updated information
          this.backpackObjects.forEach((obj) => {
            if(obj.id === parseInt(object.obj_id)){
              obj = updatedObject.data.objectInstance[0]
            }
            if(obj.member_id !== this.$store.data.user.id){
              alteredBackpack.push(obj)
            }
          })
        this.backpackObjects = alteredBackpack;
        }
      }
    },
    textToSpeech(data){
      const message = data.msg;
      let speech = new SpeechSynthesisUtterance();
      speech.text = message;
      window.speechSynthesis.speak(speech);
    },
    exactCompare(inputs, outputs, message){
      let reply = "";
      for(let x = 0; x < inputs[0].length; x++) {
        if (inputs[0][x].toLowerCase() === message && message !== ''){
          reply = outputs[0][x];
          break;
        }
      }
      return reply;
    },
    andCompare(inputs, outputs, message){
      let reply = "";
      let compareMsg = message.replace(/[^a-zA-Z0-9 ]/g, '');
      let compareInputs = inputs[1];
      compareMsg = message.split(" ");

      for(let i = 0; i < compareInputs.length; i++){
        let compare = compareInputs[i].split(" ");
        let matches = [];
        for(let x = 0; x < compare.length; x++){
          if(compareMsg.includes(compare[x].toLowerCase())){
            matches.push(compare[x]);
          }
        }
        if(matches.length === compare.length){
          reply = outputs[1][i];
          break;
        }
      }
      return reply;
    },
    orCompare(inputs, outputs, message){
      let reply = "";
      let compareMsg = message.replace(/[^a-zA-Z0-9 ]/g, '');
      let compareInputs = inputs[2];
      compareMsg = message.split(" ");

      for(let i = 0; i < compareInputs.length; i++){
        let compare = compareInputs[i].split(" ");
        for(let x = 0; x < compare.length; x++){
          if(compareMsg.includes(compare[x].toLowerCase())){
            reply = outputs[2][i];
            break;
          }
        }
      }
      return reply;
    },
    checkForEntryMessage(){
      if(
        this.virtualPetInputs[0][0] === '' && 
        this.virtualPetOutputs[0][0] !== ''
      ){
        this.petResponse({msg: `sendEntryMessage${this.entryMessageCode}`, username: this.$store.data.user.username});
      }
    },
    petResponse(data){
      let response = null;
      let whisper = null;
      let directly = false;
      let beam = false;
      let message = data.msg.toLowerCase().trim();

      // Check if directed at pet
      // Name mentioned, Whispered to, or in a private chat
      if(message.search(this.virtualPet.pet_name.toLowerCase()) > -1){
        message = message.replace(this.virtualPet.pet_name.toLowerCase(), '').trim();
        directly = true;
      }
      
      // Or Check
      // Only response when message includes any of the keywords
      if(this.orCompare(this.virtualPetInputs, this.virtualPetOutputs, message)){
        response = this.orCompare(this.virtualPetInputs, this.virtualPetOutputs, message);
      }
      
      // And Check
      // Only responds when message includes ALL keywords listed
      if(this.andCompare(this.virtualPetInputs, this.virtualPetOutputs, message)){
        response = this.andCompare(this.virtualPetInputs, this.virtualPetOutputs, message);
      }

      // Exact Check
      // Only responds when input matches phrase exactly
      if(this.exactCompare(this.virtualPetInputs, this.virtualPetOutputs, message)){
        response = this.exactCompare(this.virtualPetInputs, this.virtualPetOutputs, message);
      };

      // If no messages match but message is directed at the pet
      if(!response && directly){
        let random = Math.floor(Math.random() * this.virtualPetDefault.length);
        response = this.virtualPetDefault[random];
        beam = true;
      }

      // Send a message on entry
      if(data.msg === `sendEntryMessage${this.entryMessageCode}`){
        response = this.virtualPetOutputs[0][0];
      }

      // Check if whisper, beaming, or directly is required
      if(response){
        let index = this.virtualPetMessageData.indexOf(response);
        if(this.virtualPetWhisper[index] === true){
          whisper = true;
        }
        if(this.virtualPetDirectly[index] === true){
          if(!directly){
            response = null;
          }
        }
        if(this.virtualPetBeam[index] === true || beam === true){
          if(this.$store.data.view3d && data.username === this.$store.data.user.username){
            this.$emit('pet-beam', {
            url: this.virtualPet.pet_avatar_url,
            name: this.virtualPet.pet_name,
            id: this.virtualPet.id,
          });
          }
        }
      } 
      
      if(response){
        if(whisper && data.username === this.$store.data.user.username){
          setTimeout(() => {
            this.messages.push({msg: response, username: data.msg.username, from: this.virtualPet.pet_name, whisper: true, new: true,})
            if(this.tts){
              this.textToSpeech({msg: response});
              console.log(response);
            }
          }, 1500);
        } 
        if(!whisper) {
          setTimeout(() => {
            this.messages.push({msg: response, username: this.virtualPet.pet_name, new: true,})
            if(this.tts){
              this.textToSpeech({msg: response});
            }
          }, 1500);
        }
      }
    },
    startSocketListeners(): void {
      this.$socket.on("CHAT", data => {
        this.debugMsg("chat message received...", data);
        if(this.virtualPet){
          this.petResponse(data);
        }
        if(this.blockedMembers.includes(data.username) === false){
          this.messages.push(data);
          if(this.tts){
            this.textToSpeech(data);
          }
        }
      });
      this.$socket.on("AV:del", event => {
        this.systemMessage(event.username + " has left.");
        this.users = this.users.filter((u) => u.id !== event.id);
        let index = this.worldMembers.indexOf(event.username);
        if(index > -1){
          this.worldMembers.splice(index, 1);
        }
      });
      this.$socket.on("AV:new", event => {
        this.systemMessage(event.username + " has entered.");
        this.users.push(event);
        this.isMember3D(event);
      });
      this.$socket.on("disconnect", () => {
        this.systemMessage("Chat server disconnected. Please refresh to reconnect.");
        this.setTimers(false);
        this.chatEnabled = false;
      });
      this.$socket.on("update-object", (object) => {
        if([object.member_username, object.buyer_username].includes(this.$store.data.user.username) || 
          [object.member_username, object.buyer_username].includes(this.username)){
          this.updateObjectLists(object);
        }
      });
      this.$socket.on("moderation_event", data => {
        if(data.data.event === 'delete-message') {
          this.deleteMessageFromLive(data.data.messageID);
        }
      });
    },
    dropObject() {
      this.$emit("drop-object", this.objectId);
      this.closeMenu();
      this.backpackObjects = this.backpackObjects.filter(obj => {
        return obj.id !== this.objectId;
      })
    },
    pickUpObject() {
      this.$emit("pickup-object", this.objectId);
      this.closeMenu();
    },
    async loadBackpack() {
        this.backpackObjects = [];
        const response = await this.$http.get(`/member/backpack/${this.$store.data.user.username}`);
        this.backpackObjects = response.data.objects;
    },
    async userBackpack(){
      this.closeMenu();
      this.activePanel = "userBackpack";
      await this.loadUserBackpack();
    },
    async loadUserBackpack(){
      this.menuBeamTo = false;
      this.menuWhisper = false;
      this.menuInviteChat = false;
      this.menuIgnore = false;
      this.menuDrop = false;
      this.menuMove = false;
      this.menuTake = false;
      this.menuBuy = false;
      this.menuDestroy = false;
      this.menuProperties = true;
      this.menuRequestBackpack = false;
      this.usernameBackPack = this.username;
      this.backpackObjects = [];
      const response = await this.$http.get(`/member/backpack/${this.username}`);
      this.backpackObjects = response.data.objects;
    },
    setTimers(status){
      if(status === true) {
        this.chatIntervalId = setInterval(this.systemMessage, 10 * 60 * 1000);
        this.pingIntervalId = setInterval(this.pingActive, 5 * 60 * 1000);
      }
      if(status === false) {
        clearInterval(this.chatIntervalId);
        clearInterval(this.pingIntervalId);
      }
    },
    deleteMessageFromLive(message) {
      let index = -1;
      this.messages.forEach((res) => {
        if(res.id === message) {
          index = this.messages.indexOf(res);
        }
      });
      if(index > -1) {
        this.messages.splice(index, 1);
      }
    },
  },
  watch: {
    place() {
      this.startNewChat();
    },
    messages: {
      handler(newMessages, oldMessages) {
        if (oldMessages.length > 0 && newMessages[0] !== oldMessages[0]) {
        } else {
          const chat = this.$refs.chatArea as Element;
          this.$nextTick(function () {
            chat.scrollTop = chat.scrollHeight;
            setTimeout(() => {
              chat.scrollTop = chat.scrollHeight;
            }, 50);
          });
        }
      },
      deep: true,
    },
    async activePanel() {
      if(this.activePanel === 'backpack') {
        await this.loadBackpack();
      }
      if(this.activePanel === 'places') {
        await this.getActivePlaces();
      }
    },
  },
  computed: {
    connected: function() { return this.$socket.connected; },
  },
  beforeDestroy() {
    this.setTimers(false);
  },
  mounted() {
    this.debugMsg("starting chat page...");
    this.startSocketListeners();
    if (this.$store.data.place && this.connected) {
      this.chatEnabled = true;
      this.startNewChat();
      this.canAdmin();
      this.getRole();
      this.getXpAmount();
      this.joinedChat();
      this.setTimers(true);
    }
  },
});
</script>
