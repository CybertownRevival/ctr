<template>
  <div id="Inbox" class="w-full flex-1 h-full">
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
        <p><h2><center>{{ this.placeName }}'s Inbox</center></h2></p>
        <p><div class="content" v-html="this.inboxIntro"/></p>
        <hr/>
        <div v-if="this.boardadmin">
          <div v-if="inboxmessages <= 0">
            No messages to display
          </div>
          <div>
            <p v-for="(id, index) in inboxmessages" :key="id.id">
              <a href="#" @click.prevent="getMessage(
            id.id,
            id.created_at,
            id.username,
            id.subject,
            id.parent_id,
            id.reply);">{{ new Date(id.created_at)
                  .toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    timeZone: 'America/Detroit',
                  })}}</a>
              From: {{ id.username }}
              Subject: <span v-if="id.reply === 1">RE: </span> {{ id.subject }}
            </p>
          </div>
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
                @click="deleteInboxMessage()">DELETE</button>
          </div>
        </div>
        </div>
        <div class="w-full flex flex-row">
          <div class="flex-grow border-2 border-black"/>
          <p>
            <div class="flex-grow border-black"
                 style="width:99%; margin-top: 10px" v-html="this.dmessage"/>
        </div>
      </div>
    </div>
    <div v-if="this.active === 'post'">
      <div v-if="success" class="text-chat"><center>{{ success }}</center></div>
      <div v-if="error" class="text-red-500"><center>{{ error }}</center></div>
      <div class="content" v-html="this.inboxIntro"/>
      <div class="mt-0.5 mb-0.5"><hr/></div>
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
        <button class="btn" @click="switchView()">CANCEL</button>&nbsp;&nbsp;&nbsp;
        <button type="submit" class="btn" @click="postInboxMessage()">POST</button>
      </center>
    </div>
    <div v-if="this.active === 'reply'">
      <center>
        <label for="subject">Subject:</label>&nbsp;&nbsp;
        RE: {{ dsubject }}<br><br>
        <label for="body">Message:</label><br>
        <textarea id="body" class="text-black w-2/3 h-96" v-model="body"></textarea>
        <div class="mt-0.5 mb-0.5 text-red-500" v-show="error">
          {{ error }}
        </div>
        <div class="mt-0.5">
          <button class="btn" @click="switchView()">CANCEL</button>&nbsp;&nbsp;&nbsp;
          <button type="submit" class="btn" @click="postInboxReply()">REPLY</button>
        </div>
      </center>
    </div>
    <div v-if="this.active === 'manage'">
      <center>
        <h2>{{ this.placeName }} Manager</h2>
        <textarea id="intro" class="text-black w-2/3 h-96" v-model="intro">
          {{ this.inboxIntro }}
        </textarea><br><br>
        <button class="btn" @click="switchView()">CANCEL</button>&nbsp;&nbsp;&nbsp;
        <button type="submit" class="btn" @click="changeInboxIntro">UPDATE</button>
      </center>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from "vue";

import { debugMsg } from "@/helpers";
import {response} from "express";

export default Vue.extend({
  name: "Inbox",
  data: () => {
    return {
      active: "view",
      boardadmin: false,
      body: "",
      ddate: "",
      dfrom: "",
      dfromid: 0,
      did: 0,
      display: false,
      dmessage: "",
      dparentid: "",
      dreply: "",
      dsubject: "",
      error: "",
      intro: "",
      inboxmessages: [],
      placeinfo: [],
      subject: "",
      success: "",
      placeName: "",
      inboxIntro: "",
    };
  },
  methods: {
    //manage introduction information for message board
    async changeInboxIntro(): Promise<void> {
      try {
        await this.$http.post("/inbox/changeinboxintro", {
          place_id: this.$route.params.place_id,
          intro: this.intro,
          type: this.placeinfo[0].type,
        });
        this.success = "Inbox Information Updated";
        this.error = "";
        this.display = false;
      } catch (error) {
        this.error = error.response.data.error;
        this.success = "";
      } finally {
        this.getInboxMessages();
        this.getInfo();
        this.active = "view";
      }

    },
    //delete a specific message
    async deleteInboxMessage(): Promise<void> {
      try {
        const {data} = await this.$http.post("/inbox/deletemessage/", {
          place_id: this.$route.params.place_id,
          message_id: this.did,
          type: this.placeinfo[0].type,
        });
        this.success = "Message Deleted";
        this.error = "";
        this.display = false;
      } catch (error) {
        this.error = error.response.data.error;
        this.success = "";
      } finally {
        this.getInboxMessages();
      }

    },
    //get admin info from db and/or check if user is owner of message board
    async getAdminInfo(): Promise<any> {
      console.log(this.placeinfo[0].type);
      return this.$http.post("/inbox/getadmininfo", {
        place_id: this.$route.params.place_id,
        type: this.placeinfo[0].type,
      }).then((response) => {
        this.boardadmin = response.data.admin;
        if (!this.boardadmin){
          this.active = "post";
        }
      });
    },

    //get message board introduction information
    async getInfo(): Promise<void> {
      return this.$http.post("/inbox/info/", {
        place_id: this.$route.params.place_id,
      }).then((response) => {
        this.placeinfo = response.data.placeinfo;
        this.placeName = this.placeinfo[0].name;
        this.inboxIntro = this.placeinfo[0].inbox_intro;
      });
    },
    //get and prepares specific information for displaying in lower div
    async getMessage(
      id: number,
      date: string,
      user: string,
      subject: string,
      parentid: string,
      reply: string,
    ): Promise<void> {
      return this.$http.post("/inbox/getmessage/", {
        message_id: id,
		place_id: this.$route.params.place_id,
		type: this.placeinfo[0].type,
      }).then((response) => {
        console.log(response.data);
        this.dmessage = response.data.message;
        this.ddate = date;
        this.dfrom = user;
        this.dfromid = response.data.member_id;
        this.dsubject = subject;
        this.did = id;
        this.dparentid = parentid;
        this.dreply = reply;
        this.display = true;
      });
    },
    //gets all messages that are active on message board
    async getInboxMessages(): Promise<void> {
      return this.$http.post("/inbox/messages/", {
        place_id: this.$route.params.place_id,
      }).then((response) => {
        this.inboxmessages = response.data.inboxmessages;
      });
    },
    //post a message to the message board
    async postInboxMessage(): Promise<void> {
      try {
        const {data} = await this.$http.post("/inbox/postmessage", {
          place_id: this.$route.params.place_id,
          subject: this.subject,
          body: this.body,
        });
        this.success = "Message was posted";
        this.error = "";
        if (this.boardadmin) this.active = "view";
        else this.active = "post";
        this.subject = "";
        this.body = "";
        this.getInboxMessages();
      } catch (error) {
        this.error = error.response.data.error;
        //this.body = error.response.data.error.body;
        this.success = "";
      }
    },
    //post a reply to message board
    async postInboxReply(): Promise<void> {
      try {
        const {data} = await this.$http.post("/inbox/postreply", {
          memberId: this.dfromid,
          subject: this.dsubject,
          body: this.body,
          parent_id: this.dparentid,
        });
        this.success = "Reply was sent";
        this.error = "";
        this.active = "view";
        this.subject = "";
        this.body = "";
      } catch (error) {
        console.log(error);
        this.error = error.response.data.error;
        this.success = "";
      }
    },
    //button action for manage
    switchManage(): void {
      this.intro = this.placeinfo[0].inbox_intro;
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
      this.body = "";
      this.subject = "";
      this.display = false;
      this.error = "";
      this.success = "";
      if (this.boardadmin){
        this.active = "view";
      } else window.close();
    },
  },
  async created() {
    await this.getInfo();
    await this.getAdminInfo();
    if (this.boardadmin) await this.getInboxMessages();
  },
  watch: {
    active: function(newValue) {
      if (newValue === "view") {
        this.getInboxMessages();
      }
    },
  },
});
</script>
