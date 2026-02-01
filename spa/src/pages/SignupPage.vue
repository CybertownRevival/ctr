<template>
  <div class="flex-1">
    <div align="center">
      <font face="Arial, Helvetica, sans-serif" size="-1">
        <table cellpadding="8">
          <tr>
            <td>
              <div align="center">
                <font color="#00FF00"
                  >Immigration is absolutely FREE, so join NOW!</font
                ><br />
                <font size="+2">CYBERTOWN Immigration - New Member</font>
                <img
                  src="/assets/img/login/immicode.jpeg"
                  border="0"
                  alt="Immigrate"
                />
                <br />
              </div>
              <p align="center" v-if="showError" class="text-red-500">
                {{ error }}
              </p>
              <p align="center" v-if="showSuccess" color="#00FF00">
                Account Created!
                <router-link to="/login">Click here to login.</router-link>
              </p>
              <div align="center" v-if="!showSuccess">
                <div class="flex justify-center">
                  <h3 class="p-2"><router-link to="/privacypolicy"> Privacy Policy </router-link></h3>
                  <h3 class="p-2"><router-link to="/rulesandregulations"> Rules and Regulations </router-link></h3>
                  <h3 class="p-2"><router-link to="/constitution"> Constitution </router-link></h3>
                </div>
                
                <br />
                <font color="#ffff00">*** These fields are mandatory!</font>
                <font color="red" size="+1"></font>
                <form
                  method="post"
                  action="/web/20020601150754/http://www.cybertown.com/cgi-bin/cybertown/register"
                  name="im_form"
                  onsubmit="addIM3Text()"
                >
                  <input type="hidden" name="TKT" value="" />
                  <table border="0">
                    <tr>
                      <td colspan="3">
                        <font color="#00FF00" size="+1"
                          >Create your Cybertown Nickname and Password</font
                        >
                      </td>
                    </tr>
                    <tr>
                      <td width="150" valign="top">
                        <font color="#ffff00">***</font> Your nickname:
                      </td>
                      <td width="200" valign="top">
                        <input
                          v-model="username"
                          maxlength="16"
                          size="16"
                          class="input-text"
                        />
                      </td>
                      <td width="200" valign="top">
                        <font color="#00FF00" size="-1"
                          >Allowed characters are
                          [A-Z],[a-z],[0-9],'_','-','.'</font
                        >
                      </td>
                    </tr>
                    <tr>
                      <td valign="top">
                        <font color="#ffff00">***</font> Your email address:
                      </td>
                      <td valign="top">
                        <input
                          v-model="email"
                          maxlength="64"
                          size="32"
                          class="input-text"
                        />
                      </td>
                      <td valign="top" rowspan="2">
                        <font color="#FF0000"
                          >Be sure that you type in your
                          <b>email address correctly</b> as you will receive an
                          <b>immigration email</b> in a few seconds!<br />
                          And don't worry, nobody else will see your email
                          address later!</font
                        >
                      </td>
                    </tr>
                    <tr>
                      <td valign="top">Please re-type your email address:</td>
                      <td valign="top">
                        <input
                          v-model="email2"
                          maxlength="64"
                          size="32"
                          class="input-text"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td valign="top">
                        <font color="#ffff00">***</font> Choose a password:
                      </td>
                      <td valign="top">
                        <input
                          type="password"
                          v-model="password"
                          size="16"
                          maxlength="256"
                          class="input-text"
                        />
                      </td>
                      <td valign="top">&nbsp;</td>
                    </tr>
                    <tr>
                      <td valign="top">
                        <font color="#ffff00">***</font> Retype your password:
                      </td>
                      <td valign="top">
                        <input
                          type="password"
                          v-model="password2"
                          size="16"
                          maxlength="256"
                          class="input-text"
                        />
                      </td>
                      <td valign="top">&nbsp;</td>
                    </tr>
                  </table>
                  <p align="center">
                    <button
                      type="button"
                      class="btn"
                      value="Immigrate"
                      @click="signup"
                    >
                      Immigrate
                    </button>
                  </p>
                </form>
              </div>
            </td>
          </tr>
        </table>
        <br clear="all" />
      </font>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import appStore from "@/appStore";

export default Vue.extend({
  name: "SignupPage",
  data() {
    return {
      email: "",
      email2: "",
      username: "",
      password: "",
      password2: "",
      showError: false,
      showSuccess: false,
      error: "",
    };
  },
  methods: {
    async signup() {
      this.showError = false;

      if (this.password !== this.password2) {
        this.error = "Please enter your password the same twice.";
        this.showError = true;
        return;
      }

      try {
        const { data } = await this.$http.post("/member/signup", {
          email: this.email,
          username: this.username,
          password: this.password,
        });
        this.showSuccess = true;

        this.$store.methods.setUser({
          username: data.username,
          hasHome: false,
        });

        this.$store.methods.setToken(data.token);
        this.$router.push({ path: "/place/enter" });
      } catch (error: any) {
        if (error.response.data.error) {
          this.error = error.response.data.error;
          this.showError = true;
        } else {
          this.error = "An unknown error occurred";
          this.showError = true;
        }
      }
    },
  },
});
</script>
