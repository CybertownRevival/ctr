<template>
  <div id="MessageBoard" class="w-full flex-1 h-full">
    <div v-if="this.active === 'view'" style="height:100%">
      <div class="overflow-y-auto" style="height:70%">
        <div v-if="success" class="text-chat"><center>{{ success }}</center></div>
        <div v-if="error" class="text-red-500"><center>{{ error }}</center></div>
        <div class="flex flex-row justify-center">
          <div class="flex border-4 border-black justify-center">
            <button class="btn-ui" @click="switchPost()">POST</button>
          </div>
          <div class="flex border-4 border-black justify-center">
            <button class="btn-ui" @click="switchManage()" v-show="this.boardadmin">MANAGE</button>
          </div>
        </div>
        <p><h2><center>{{ this.placeinfo[0].name }}'s Message Board</center></h2></p>
        <p><div class="content" v-html="this.placeinfo[0].messageboard_intro"/></p>
        <hr/>
        <div v-if="messageboardmessages <= 0">
          No messages to display
        </div>
        <div>
          <p v-for="(id, index) in messageboardmessages" :key="id.id">
            <span v-if="id.reply === 1">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
            <a href="#" @click.prevent="getMessage(
              id.id,
              id.created_at,
              id.username,
              id.subject,
              id.parent_id,
              id.reply);">{{ id.created_at }}</a>
            From: {{ id.username }}
            Subject: <span v-if="id.reply === 1">RE: </span> {{ id.subject }}
          </p>
        </div>
      </div>
      <div v-if="!display" class="w-full" style="height:30%">
        <hr/>
      </div>
      <div v-if="display" class="w-full overflow-y-auto" style="height:30%">
        <hr/>
        <div class="border-black border-4"/>
        <div class="w-full flex flex-row">
          <div class="flex-grow border-2 border-black"/>
          <div class="flex-grow" style="width:80%">
            <p>Date: {{ ddate }}</p>
            <p>Subject: <span v-if="this.dreply === 1">RE: </span>{{ dsubject }}</p>
            <p>From: {{ dfrom }}</p>
          </div>
          <div class="flex-grow" style="width:19%">
            <div class="flex-grow border-2 border-black">
              <button class="btn-ui" @click="switchReply()">REPLY</button>
            </div>
            <div class="flex-grow border-2 border-black">
              <button
               class="btn-ui"
               v-show="this.boardadmin"
               @click="deleteMessageboardMessage()">DELETE</button>
            </div>
          </div>
        </div>
        <div class="w-full flex flex-row">
          <div class="flex-grow border-2 border-black"/>
          <p><div class="flex-grow border-black" style="width:99%; margin-top: 10px" v-html="this.dmessage[0].message"/></p>
        </div>
      </div>
    </div>
    <div v-if="this.active === 'post'">
      <center>
        <div class="text-red-300 justify-center" v-if="error">
          {{ error }}
        </div>
        <div>
          <h2>Post a Message</h2>
        </div>
        <div class="text-sm text-yellow-200 w-5/12 justify-center border-black border-4">
          Some HTML coding has been blocked for security reasons.  Basic HTML tags
          (i.e. &lt;p&gt;, &lt;br&gt;, &lt;a href&gt;, and &lt;img src&gt;) are
          allowed.  If a disallowed tag is used, an error message will display.
        </div>
        <label for="subject">Subject:</label>&nbsp;&nbsp;
        <input type="text" class="text-black" id="subject" v-model="subject" size="50"/><br><br>
        <label for="body">Message:</label><br>
        <textarea id="body" class="text-black w-2/3 h-96" v-model="body"></textarea><br><br>
        <button class="btn" @click="switchView()">CANCEL</button>&nbsp;&nbsp;&nbsp;<button type="submit" class="btn" @click="postMessageboardMessage()">POST</button>
      </center>
    </div>
    <div v-if="this.active === 'reply'">
      <center>
        <label for="subject">Subject:</label>&nbsp;&nbsp;
        RE: {{ dsubject }}<br><br>
        <label for="body">Message:</label><br>
        <textarea id="body" class="text-black w-2/3 h-96" v-model="body"></textarea><br><br>
        <button class="btn" @click="switchView()">CANCEL</button>&nbsp;&nbsp;&nbsp;<button type="submit" class="btn" @click="postMessageboardReply()">REPLY</button>
      </center>
    </div>
    <div v-if="this.active === 'manage'">
      <center>
        <h2>{{ this.placeinfo[0].name }} Manager</h2>
        <textarea id="intro" class="text-black w-2/3 h-96" v-model="intro">
          {{ this.placeinfo[0].messageboard_intro }}
        </textarea><br><br>
        <button class="btn" @click="switchView()">CANCEL</button>&nbsp;&nbsp;&nbsp;
        <button type="submit" class="btn" @click="changeMessageboardIntro">UPDATE</button>
      </center>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from "vue";

import {
  debugMsg,
} from "@/helpers";
import {response} from "express";

export default Vue.extend({
  name: "MessageBoard",
  data: () => {
    return {
      active: "view",
      boardadmin: false,
      body: "",
      ddate: "",
      dfrom: "",
      did: 0,
      display: false,
      dmessage: "",
      dparentid: "",
      dreply: "",
      dsubject: "",
      error: "",
      intro: "",
      messageboardmessages: [],
      placeinfo: [],
      subject: "",
      success: "",
    };
  },
  methods: {
    //manage introduction information for message board
    async changeMessageboardIntro(): Promise<void> {
      try {
        const {data} = await this.$http.post("/messageboard/changemessageboardintro", {
          place_id: this.$route.params.place_id,
          intro: this.intro,
        });
        this.success = "Message Board Information Updated";
        this.error = "";
        this.display = false;
      } catch (error) {
        this.error = error.response.data.error;
        this.success = "";
      } finally {
        this.getMessageboardMessages();
        this.getInfo();
        this.active = "view";
      }
      
    },
    //delete a specific message
    async deleteMessageboardMessage(): Promise<void> {
      try {
        const {data} = await this.$http.post("/messageboard/deletemessage/", {
          place_id: this.$route.params.place_id,
          message_id: this.did,
        });
        this.success = "Message Deleted";
        this.error = "";
        this.display = false;
      } catch (error) {
        this.error = error.response.data.error;
        this.success = "";
      } finally {
        this.getMessageboardMessages();
      }
      
    },
    //get admin info from db and/or check if user is owner of message board
    //todo add check for employee of public places
    async getAdminInfo(): Promise<any> {
      return this.$http.post("/messageboard/getadmininfo", {
        place_id: this.$route.params.place_id,
      }).then((response) => {
        this.boardadmin = response.data.admin;
      });
    },
    //get message board introduction information
    async getInfo(): Promise<void> {
      return this.$http.post("/messageboard/info/", {
        place_id: this.$route.params.place_id,
      }).then((response) => {
        this.placeinfo = response.data.placeinfo;
      });
    },
    //get and prepares specific information for displaying in lower div
    async getMessage(id: number, date: string, user: string, subject: string, parentid: string, reply: string): Promise<void> {
      return this.$http.post("/messageboard/getmessage/", {
        message_id: id,
      }).then((response) => {
        this.dmessage = response.data.getmessage;
        this.ddate = date;
        this.dfrom = user;
        this.dsubject = subject;
        this.did = id;
        this.dparentid = parentid;
        this.dreply = reply;
        this.display = true;
      });
    },
    //gets all messages that are active on message board
    async getMessageboardMessages(): Promise<void> {
      return this.$http.post("/messageboard/messages/", {
        place_id: this.$route.params.place_id,
      }).then((response) => {
        this.messageboardmessages = response.data.messageboardmessages;
      });
    },
    //post a message to the message board
    async postMessageboardMessage(): Promise<void> {
      try {
        const {data} = await this.$http.post("/messageboard/postmessage", {
          place_id: this.$route.params.place_id,
          subject: this.subject,
          body: this.body,
        });
        this.success = "Message was posted";
        this.error = "";
        this.active = "view";
        this.subject = "";
        this.body = "";
        this.getMessageboardMessages();
      } catch (error) {
        this.error = error.response.data.error;
        //this.body = error.response.data.error.body;
        this.success = "";
      }
    },
    //post a reply to message board
    async postMessageboardReply(): Promise<void> {
      try {
        const {data} = await this.$http.post("/messageboard/postreply", {
          place_id: this.$route.params.place_id,
          subject: this.dsubject,
          body: this.body,
          parent_id: this.dparentid,
        });
        this.success = "Reply was posted";
        this.error = "";
        this.active = "view";
        this.subject = "";
        this.body = "";
      } catch (error) {
        this.error = "Unauthorized HTML Tag Used. The tag(s) have been removed, hit post again to send";
        this.body = "testing something";
        this.success = "";
      }
    },
    //button action for manage
    switchManage(): void {
      this.active = "manage";
    },
    //button action for post
    switchPost(): void {
      this.active = "post";
    },
    //button action for reply
    switchReply(): void {
      this.active = "reply";
    },
    //button action for message view
    switchView(): void {
      this.intro = this.placeinfo[0].messageboard_intro;
      this.body = "";
      this.subject = "";
      this.display = false;
      this.error = "";
      this.success = "";
      this.active = "view";
    },
  },
  created() {
    this.getInfo();
    this.getMessageboardMessages();
    this.getAdminInfo();
  },
  watch: {
    active: function(newValue) {
      if (newValue === "view") {
        this.getMessageboardMessages();
      }
    },
  },
});
</script>
