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

        <p><h2><center>{{ this.placeinfo[0].name }}'s Inbox</center></h2></p>
        <p><div class="content" v-html="this.placeinfo[0].inbox_intro"/></p>
        <hr/>

        <div v-if="this.boardadmin">
          <div v-if="inboxmessages <= 0">
            No messages to display
          </div>

          <!-- MESSAGE LIST WITH CHECKBOXES -->
          <div>
            <p
              v-for="msg in inboxmessages"
              :key="msg.id"
              class="flex items-center gap-2"
            >
              <input
                type="checkbox"
                v-model="selectedMessages"
                :value="msg.id"
              />

              <a href="#"
                @click.prevent="getMessage(
                  msg.id,
                  msg.created_at,
                  msg.username,
                  msg.subject,
                  msg.parent_id,
                  msg.reply
                )"
              >
                {{ new Date(msg.created_at).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric',
                  timeZone: 'America/Detroit',
                })}}
              </a>

              From: {{ msg.username }}
              Subject:
              <span v-if="msg.reply === 1">RE:</span>
              {{ msg.subject }}
            </p>
          </div>

          <!-- DELETE SELECTED BUTTON -->
          <button
            v-if="selectedMessages.length > 0"
            class="btn-ui bg-red-600 text-white mt-4"
            @click="deleteSelected"
          >
            Delete Selected ({{ selectedMessages.length }})
          </button>
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
            <p>Date: {{ new Date(ddate).toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              timeZone: 'America/Detroit',
            })}}</p>

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
                @click="deleteInboxMessage(did)"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>

        <div class="w-full flex flex-row">
          <div class="flex-grow border-2 border-black"/>
          <p>
            <div class="flex-grow border-black"
                 style="width:99%; margin-top: 10px"
                 v-html="this.dmessage"/>
        </div>
      </div>
    </div>

    <!-- POST VIEW -->
    <div v-if="this.active === 'post'">
      <div v-if="success" class="text-chat"><center>{{ success }}</center></div>
      <div v-if="error" class="text-red-500"><center>{{ error }}</center></div>

      <div class="content" v-html="this.placeinfo[0].inbox_intro"/>
      <div class="mt-0.5 mb-0.5"><hr/></div>

      <center>
        <div class="text-red-300 justify-center" v-if="error">
          {{ error }}
        </div>

        <h2>Post a Message</h2>

        <div class="text-sm text-yellow-200 w-5/12 justify-center border-black border-4">
          Some HTML coding has been blocked for security reasons.
        </div>

        <label for="subject">Subject:</label>&nbsp;&nbsp;
        <input type="text" class="text-black" id="subject" v-model="subject" size="50"/><br><br>

        <label for="body">Message:</label><br>
        <textarea id="body" class="text-black w-2/3 h-96" v-model="body"></textarea><br><br>

        <button class="btn" @click="switchView()">CANCEL</button>&nbsp;&nbsp;&nbsp;
        <button type="submit" class="btn" @click="postInboxMessage()">POST</button>
      </center>
    </div>

    <!-- REPLY VIEW -->
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

    <!-- MANAGE VIEW -->
    <div v-if="this.active === 'manage'">
      <center>
        <h2>{{ this.placeinfo[0].name }} Manager</h2>

        <textarea id="intro" class="text-black w-2/3 h-96" v-model="intro">
          {{ this.placeinfo[0].messageboard_intro }}
        </textarea><br><br>

        <button class="btn" @click="switchView()">CANCEL</button>&nbsp;&nbsp;&nbsp;
        <button type="submit" class="btn" @click="changeInboxIntro">UPDATE</button>
      </center>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

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
      selectedMessages: [] as number[],   // ← NEW
    };
  },

  methods: {
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

    // UPDATED SINGLE DELETE
	async deleteInboxMessage(messageId: number): Promise<void> {
	  try {
		await this.$http.post("/inbox/deletemessage/", {
		  place_id: this.$route.params.place_id,
		  message_id: [messageId],   // <-- ALWAYS an array now
		  type: this.placeinfo[0].type,
		});

		this.success = "Message Deleted";
		this.error = "";
		this.display = false;
	  } catch (error) {
		this.error = error.response?.data?.error || "Error deleting message";
		this.success = "";
	  } finally {
		this.getInboxMessages();
	  }
	}

    // NEW MULTI-DELETE
	async deleteSelected(): Promise<void> {
	  if (this.selectedMessages.length === 0) return;

	  try {
		await this.$http.post("/inbox/deletemessage/", {
		  place_id: this.$route.params.place_id,
		  message_id: this.selectedMessages,   // <-- already an array
		  type: this.placeinfo[0].type,
		});

		this.success = "Selected messages deleted";
		this.error = "";
		this.display = false;
	  } catch (error) {
		this.error = error.response?.data?.error || "Error deleting messages";
		this.success = "";
	  } finally {
		this.selectedMessages = [];
		this.getInboxMessages();
	  }
	},

    async getAdminInfo(): Promise<any> {
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

    async getInfo(): Promise<void> {
      return this.$http.post("/inbox/info/", {
        place_id: this.$route.params.place_id,
      }).then((response) => {
        this.placeinfo = response.data.placeinfo;
      });
    },

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

    async getInboxMessages(): Promise<void> {
      return this.$http.post("/inbox/messages/", {
        place_id: this.$route.params.place_id,
      }).then((response) => {
        this.inboxmessages = response.data.inboxmessages;
      });
    },

    async postInboxMessage(): Promise<void> {
      try {
        await this.$http.post("/inbox/postmessage", {
          place_id: this.$route.params.place_id,
          subject: this.subject,
          body: this.body,
        });
        this.success = "Message was posted";
        this.error = "";
        this.active = this.boardadmin ? "view" : "post";
        this.subject = "";
        this.body = "";
        this.getInboxMessages();
      } catch (error) {
        this.error = error.response.data.error;
        this.success = "";
      }
    },

    async postInboxReply(): Promise<void> {
      try {
        await this.$http.post("/inbox/postreply", {
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
        this.error = error.response.data.error;
        this.success = "";
      }
    },

    switchManage(): void {
      this.intro = this.placeinfo[0].inbox_intro;
      this.active = "manage";
    },

    switchPost(): void {
      this.active = "post";
    },

    switchReply(): void {
      this.active = "reply";
    },

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