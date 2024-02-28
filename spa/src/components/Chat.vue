<template>
  <div id="chat" class="flex flex-row chat space-x-1 p-1 text-chat w-full">
    <div class="messages-pane flex flex-col flex-1">
      <div class="flex-grow p-1 overflow-y-auto h-full" ref="chatArea">
        <ul>
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
              v-else-if="msg.username === $store.data.user.username && msg.new === true"
              class="text-yellow-200">
              {{ msg.username }}<span
                class="inline" v-show="msg.role"
            >[{{ msg.role }}]</span
            >: {{ msg.msg }}
              </span>
            <span v-else-if="msg.new === true">
              {{ msg.username }}<span
                class="inline" v-show="msg.role"
            >[{{ msg.role }}]</span
            >: {{ msg.msg }}
            </span>
          </li>
        </ul>
      </div>
      <div
        class="flex flex-none flex-row space-x-0.5 bg-black"
        v-show="connected"
      >
        <input
          type="text"
          v-model="message"
          class="flex-grow p-0.5 text-black"
          @keyup.exact.enter="sendMessage"
          maxlength="255"
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
    <div class="flex flex-none flex-col w-60 space-0.5 bg-black">
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
          Places (0)
        </span>
        <span v-if="activePanel === 'gestures'" class="flex-grow">
          Body Language
        </span>
        <span v-if="activePanel === 'sharedObjects'" class="flex-grow">
          Objects ({{  this.sharedObjects.length }})
        </span>
        <span v-if="activePanel === 'backpack'" class="flex-grow">
          My Backpack ({{  this.backpackObjects.length }})
        </span>
        <span v-if="activePanel === 'userBackpack'" class="flex-grow">
          <span id="userBackpack"></span>'s Backpack ({{ this.backpackObjects.length }})
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
        >
          Next
        </button>
      </div>
      <div class="flex-grow overflow-y-auto p-1 messages-pane">
        <ul v-if="activePanel === 'users'">
          <li class="text-white">
            <img src="/assets/img/av_me.gif" class="inline" />
            {{ this.$store.data.user.username }}
          </li>
          <li class="cursor-default" v-for="(user, key) in users" :key="key" @mouseup="userMenu(user.id, user.username)">
            <img src="/assets/img/av_mute.gif" class="inline" v-if="blockedMembers.includes(user.username) === true" />
            <img src="/assets/img/av_def.gif" class="inline" v-else />
            
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
        <ul v-if="activePanel === 'sharedObjects'">
          <li
            v-for="object in sharedObjects"
            :key="object.id"
            class="flex cursor-default"
          >
            <div class="flex-1 whitespace-nowrap overflow-x-hidden"  @mouseup="userMenu(object.id)">
              {{ object.object_name }}
            </div>
          </li>
        </ul>
        <ul v-if="activePanel === 'backpack' || activePanel === 'userBackpack'">
          <li
            v-for="object in backpackObjects"
            :key="object.id"
            class="flex cursor-default"
          >
            <div class="flex-1 whitespace-nowrap overflow-x-hidden" style="max-width: 165px;" @mouseup="userMenu(object.id)">
              {{ object.object_name }}
            </div>
          </li>

        </ul>
      </div>
    </div>
    <div id="userMenu" 
      class="
        absolute
        flex-none
        w-40
        text-black
        bg-gray-300
        cursor-pointer
      " 
      style="border: outset #EEE;" 
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
          Cancel Menu
        </li>
        <li style="border: inset #EEE 3px;"></li>
        <li v-if="
          this.$store.data.view3d === true &&  
          activePanel === 'users' ||
          this.$store.data.view3d === true &&
          activePanel === 'sharedObjects'" 
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
        <li v-if="activePanel === 'users'" 
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
        <li v-if="activePanel === 'users'" 
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
        <li v-if="activePanel === 'users'" 
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
        <li v-if="activePanel === 'sharedObjects' 
          && $store.data.view3d
          && canInteractWithObject" 
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
        <li v-if="activePanel === 'sharedObjects' &&
          candModify" 
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
        <li v-if="activePanel === 'backpack' 
          && canInteractWithObject" 
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
        <li v-if="activePanel === 'sharedObjects' 
          && canInteractWithObject 
          || activePanel === 'backpack'" 
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
        <li v-if="activePanel === 'sharedObjects' 
          || activePanel === 'backpack' || activePanel === 'userBackpack'" 
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
        <li v-if="activePanel === 'users'" style="border:inset #EEE 3px;"></li>
        <li v-if="activePanel === 'users'" 
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
      activePanel: "users",
      objectId: null,
      canInteractWithObject: false,
      candModify: false,
      memberId: null,
      username: null,
      blockedUser: false,
      blockedMembers: [],
      whisper: null,
      privateChat: null,
      cursorX: null,
      cursorY: null,
      numberOfPosts: 0,
    };
  },
  methods: {
    async getRole(): Promise<void> {
      const response = await this.$http.get("/member/getrolename");
      if(response.data.PrimaryRoleName.length === 0 ){
        this.primaryRole = "";
      } else {
        this.primaryRole = response.data.PrimaryRoleName[0].name;
      }
    },
    debugMsg,
    sendMessage(): void {
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
        this.$socket.emit("CHAT", {
          msg: this.message,
          role: this.primaryRole,
        });
        this.$http
          .post("/message/place/" + this.$store.data.place.id, {
            body: this.message,
          })
          .then((response) => {
            this.debugMsg(response.data);
          });
        this.numberOfPosts = ++this.numberOfPosts;
        this.message = "";
      }
    },
    systemMessage(msg: string): void {
      this.messages.push({
        type: "system",
        msg: msg,
        time: new Date().toLocaleTimeString("en-US", {timeZone: "America/New_York"}),
      });
    },
    preventMenu(){
      let chat = document.getElementById("chat")
      chat.addEventListener("contextmenu", function(e){
        e.preventDefault()
      })
      document.addEventListener('mousemove', this.onMouseUpdate, false);
      document.addEventListener('mouseenter', this.onMouseUpdate, false);
    },
    onMouseUpdate(e){
      this.cursorX = e.pageX;
      this.cursorY = e.pageY;
    },

    userMenu(...target){
      let userMenu = document.getElementById('userMenu');
      userMenu.style.display = "block";
      if(this.cursorY >= window.innerHeight - 90){
        userMenu.style.top = this.cursorY - 55 + "px";
      }
      else{
        userMenu.style.top = this.cursorY - 15 + "px";
      }
      if(this.cursorX >= window.innerWidth - 315){
        userMenu.style.left = this.cursorX - 115 + "px";
      }
      else{
        userMenu.style.left = this.cursorX - 15 + "px";
      }
      this.objectId = target[0];
      this.username = target[1];
    },
    closeMenu(){
      let userMenu = document.getElementById('userMenu');
      userMenu.style.display = "none";
    },
    objectOpener() {
      this.closeMenu();
      window.open("/#/object/"+this.objectId, "targetWindow", "width=1000px,height=700px,location=0,menubar=0,status=0,scrollbars=0");
    },
    startNewChat(): void {
      this.preventMenu();
      let userMenu = document.getElementById('userMenu');
      userMenu.style.display = "none";
      this.messages = [];
      this.users = [];
      this.canInteractWithObject = false;
      if(this.$store.data.place.member_id === this.$store.data.user.id) {
        this.candModify = true;
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
        });
    },
    changeActivePanel(): void {
      this.backpackObjects = [];
      switch (this.activePanel) {
        case "users":
          this.activePanel = "gestures";
          break;
        case "gestures":
          this.activePanel = "places";
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
    startSocketListeners(): void {
      this.$socket.on("CHAT", data => {
        this.debugMsg("chat message received...", data);
        this.debugMsg(this.blockedMembers.includes(data.username));
        if(this.blockedMembers.includes(data.username) === false){
          this.messages.push(data);
        } 
      });
      this.$socket.on("AV:del", event => {
        this.systemMessage(event.username + " has left.");
        this.users = this.users.filter((u) => u.id !== event.id);
      });
      this.$socket.on("AV:new", event => {
        this.systemMessage(event.username + " has entered.");
        this.users.push(event);
      })
      ;
      this.$socket.on("disconnect", () => {
        this.systemMessage("Chat server disconnected. Please refresh to reconnect.");
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
      this.loadBackpack();
    },
    async loadBackpack() {
        this.backpackObjects = [];
        const response = await this.$http.get(`/member/backpack/${this.$store.data.user.id}`);
        this.backpackObjects = response.data.objects;
    },
    updateBackpack(){
      this.backpackObjects = [];
    },
    async userBackpack(){
      this.activePanel = "userBackpack";
      await this.loadUserBackpack();
      this.closeMenu();
    },
    async loadUserBackpack(){
      const memberIdRequest = await this.$http.get(`/member/memberId/${this.username}`);
      this.memberId = memberIdRequest.data.userId[0].id;
      this.backpackObjects = [];
      let userBP = document.getElementById("userBackpack");
      userBP.textContent = this.username;
      const response = await this.$http.get(`/member/backpack/${this.memberId}`);
      this.backpackObjects = response.data.objects;
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
    },
  },
  computed: {
    connected: function() { return this.$socket.connected; },
  },
  mounted() {
    this.debugMsg("starting chat page...");
    this.startSocketListeners();
    if (this.$store.data.place) {
      this.startNewChat();
      this.getRole();
      setInterval(this.systemMessage, 5 * 60 * 1000);
    }
  },
});
</script>
