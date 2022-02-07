<template>
  <div class="flex flex-row chat space-x-1 p-1 text-chat w-full">
    <div class="messages-pane flex flex-col flex-1">
      <div class="flex-grow p-1 overflow-y-auto h-full" ref="chatArea">
        <ul>
          <li v-for="(msg, key) in messages" :key="key">
            <strong
              v-if="msg.type && msg.type === 'system'"
              class="text-white"
              >{{ msg.msg }}</strong
            >
            <span v-else>{{ msg.userName }}: {{ msg.msg }}</span>
          </li>
        </ul>
      </div>
      <div
        class="flex flex-none flex-row space-x-0.5 bg-black"
        v-if="connected"
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
        <span v-if="activePanel === 'users'" class="flex-grow"
          >({{ this.users.length + 1 }}) {{ place.name }}</span
        >
        <span v-if="activePanel === 'gestures'" class="flex-grow"
          >Body Language</span
        >
        <span v-if="activePanel === 'sharedObjects'" class="flex-grow"
          >Objects</span
        >
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
            {{ this.$store.data.user.userName }}
          </li>
          <li v-for="(user, key) in users" :key="key">
            <img src="/assets/img/av_invis.gif" class="inline" />{{
              user.userName
            }}
          </li>
        </ul>
        <ul v-if="activePanel === 'gestures'">
          <li
            v-for="(gesture, key) in this.$store.data.user.avatar.gestures"
            :key="key"
            @click="sendGesture(key)"
          >
            {{ gesture }}
          </li>
        </ul>
        <ul v-if="activePanel === 'sharedObjects'">
          <li
            v-for="object in sharedObjects"
            :key="object.id"
            @click="moveObject(object.id)"
          >
            {{ object.name }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { io, Socket } from "socket.io-client";
import Vue from 'vue';

declare const X3D: any;

export default Vue.extend({
  name: "Chat",
  props: [
    "place",
    "browser",
    "position",
    "rotation",
    "sharedEvent",
    "sharedObjects",
  ],
  data: () => {
    return {
      connected: false,
      socket: null,
      message: "",
      messages: [],
      users: [],
      debugLog: false,
      activePanel: "users",
    };
  },
  methods: {
    debugMsg(msg) {
      if (this.debugLog) {
        console.log(msg);
      }
    },

    sendMessage() {
      this.debugMsg("sending message...");
      if (this.message !== "" && this.connected) {
        this.socket.emit("CHAT", {
          msg: this.message,
        });
        this.$http
          .post("/message/place/" + this.place.id, {
            body: this.message,
          })
          .then((response) => {
            this.debugMsg(response.data);
          });
        this.message = "";
      }
    },
    systemMessage(msg) {
      this.messages.push({
        type: "system",
        msg: msg,
      });
    },
    startChat() {
      this.$http
        .get("/message/place/" + this.place.id, {
          limit: 10,
          order: "id",
          orderDirection: "desc",
        })
        .then((response) => {
          this.messages = response.data.messages.reverse();
          this.startSocket();
        });
    },
    startSocket() {
      this.socket = io();
      this.debugMsg("starting socket...");
      this.debugMsg(localStorage.getItem("token"));

      this.socket.on("connect", () => {
        this.debugMsg("connecting...");
        this.socket.emit(
          "JOIN",
          {
            token: localStorage.getItem("token"),
            room: this.place.id,
          },
          () => {
            // JOIN ACK
            this.debugMsg("Got JOIN ack");
            this.connected = true;
            this.$emit("connected", this.connected);
            this.systemMessage("Welcome to " + this.place.name);
            const browser = X3D.getBrowser(this.browser);
            this.socket.emit("AV", {
              detail: {
                pos: [
                  browser.viewpointPosition.x,
                  browser.viewpointPosition.y,
                  browser.viewpointPosition.z,
                ],
                rot: [
                  browser.viewpointOrientation.x,
                  browser.viewpointOrientation.y,
                  browser.viewpointOrientation.z,
                  browser.viewpointOrientation.angle,
                ],
              },
            });
          }
        );
      });
      this.socket.on("SE", (e) => {
        this.$emit("se-from-server", { detail: e });
      });
      this.socket.on("CHAT", (data) => {
        this.debugMsg("chat message received...");
        this.debugMsg(data);
        this.messages.push(data);
      });
      this.socket.on("AV", (e) => {
        this.$emit("av-from-server", { detail: e });
      });
      this.socket.on("AV:del", (e) => {
        this.systemMessage(e.userName + " has left.");
        this.users = this.users.filter((u) => u.userName !== e.userName);
        this.$emit("av-from-server-del", { detail: e });
      });
      this.socket.on("AV:new", (e) => {
        this.systemMessage(e.userName + " has entered.");
        this.users.push(e);
        this.$emit("av-from-server-new", { detail: e });
      });
      this.socket.on("disconnect", () => this.debugMsg("Disconnected..."));
      this.socket.on("reconnect", () => this.debugMsg("Reconnecting..."));
    },
    endSocket() {
      this.debugMsg("ENDING socket...");
      this.socket.disconnect();
    },
    changeActivePanel() {
      switch (this.activePanel) {
        case "users":
          this.activePanel = "gestures";
          break;
        case "gestures":
          this.activePanel = "sharedObjects";
          break;
        case "sharedObjects":
          this.activePanel = "users";
          break;
      }
    },
    sendGesture(gestureIndex) {
      this.socket.emit("AV", {
        gesture: gestureIndex + 1, // Gestures in avs start at 1 for some reason.
      });
    },
    moveObject(objectId) {
      this.$emit("move-object", objectId);
    },
    sendSharedEvent(eventData) {
      if (this.connected) {
        this.socket.emit("SE", eventData.detail);
      }
    },
  },
  watch: {
    place() {
      this.debugMsg("place changed");
      this.messages = [];
      this.users = [];
      this.endSocket();
      this.startChat();
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
    position() {
      if (this.connected) {
        this.socket.emit("AV", {
          pos: this.position,
        });
      }
    },
    rotation() {
      if (this.connected) {
        this.socket.emit("AV", {
          rot: this.rotation,
        });
      }
    },
    sharedEvent: {
      handler() {
        if (this.connected && this.sharedEvent !== null) {
          this.socket.emit("SE", this.sharedEvent.detail);
        }
      },
      deep: true,
      immediate: true,
    },
  },
  computed: {},
  mounted() {
    this.debugMsg("starting chat page...");
    this.debugMsg(this.place);
    if (this.place && this.place !== null) {
      this.startChat();
    }
  },
  beforeDestroy() {
    this.debugMsg("disconnecting...");
    this.socket.disconnect();
  },
});
</script>

