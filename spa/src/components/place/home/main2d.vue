<template>
  <div class="text-center p-3">
    <!-- property/present.tmpl -->
    <h3><strong>Welcome to {{ $store.data.place.name }}</strong></h3>

    <div class="flex flex-row" >
      <div class="flex flex-auto w-2/3">
        <table class="w-full">
          <tr>
            <td class="w-130 font-bold text-left">
              Resident
            </td>
            <td class="text-left">
              {{ memberInfo.username }}
            </td>
          </tr>

          <tr>
            <td class="font-bold text-left">
              Name
            </td>
            <td class="text-left">
              {{ memberInfo.firstName }} {{ memberInfo.lastName }}
            </td>
          </tr>
          <tr v-if="parseInt(this.$store.data.user.id) == parseInt(this.$store.data.place.member_id)
          || this.$store.data.user.admin">
            <td class="font-bold text-left">
              Email
            </td>
            <td class="text-left">
              {{ memberInfo.email }}
            </td>
          </tr>

          <tr>
            <td class="font-bold text-left">
              Immigration
            </td>
            <td class="text-left">
              <!-- format Saturday, October 9 1999 -->
              {{ memberInfo.immigrationDate | dateFormatFilter }}
            </td>
          </tr>
          <!-- #ifdef variable="LAD_DAYNAME" -->
          <!-- todo: add last login date -->
          <!--
          <tr>
            <td class="font-bold text-left">
              Last Access
            </td>
            <td class="text-left">
              <$LAD_DAYNAME>, <$LAD_MONNAME> <$LAD_MDAy> <$LAD_YEAR>
            </td>
          </tr>
          -->
          <!-- #endif variable="LAD_DAYNAME" -->
          <tr>
            <td class="font-bold text-left">
              Experience
            </td>
            <td class="text-left">
              {{ memberInfo.xp }}
            </td>
          </tr>

          <tr v-if="parseInt(this.$store.data.user.id) === parseInt(this.$store.data.place.member_id)">
            <td class="font-bold text-left">
              Money
            </td>
            <td class="text-left">
               {{ memberInfo.walletBalance }}cc
            </td>
          </tr>

          <!--
          <tr>
            <td class="font-bold text-left">
              Home Page
            </td>
            <td class="text-left">
              <a href="<$HPG>" target="external"><$HPG></a>
            </td>
          </tr>
          -->
        </table>

      </div>
      <div class="flex-auto w-1/3">
        <!-- #ifdef variable="exists" -->
        <!--<img src="property<$g_exe>?ac=print&ID=<$propid>&type=P&index=&media=i" border=0 alt="">-->
        <!-- #endif variable="exists" -->

        <!-- #ifdef variable="medialocked" -->
        <!--
        <img src="<$g_Images>/images/locked.gif" border=0
              alt="Your image must be accepted by the block leader first!">
        <br>
        <font color="FFFF00"><small>Your image must be accepted by the block leader first!</small>
        </font>
        -->
        <!-- #endif variable="medialocked" -->

        <!-- #ifdef variable="upload" -->
        <!--<small><i>Click Update to upload your personal image!</i></small> -->
        <!-- #endif variable="upload" -->

        <!-- #ifdef variable="noimage" -->
        <small><i>No image uploaded yet!</i></small>
        <!-- #endif variable="noimage" -->

      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: "HomeMain2d",
  data: () => {
    return {
      memberInfo: {},

    };
  },
  methods: {
    async getData() {

      try {
        const response = await this.$http.get("/member/info/"+this.$store.data.place.member_id);
        this.memberInfo = response.data.memberInfo;
      } catch (error) {
        console.log(error);
      }
    },
  },
  mounted() {
    this.getData();
  },
});
</script>

