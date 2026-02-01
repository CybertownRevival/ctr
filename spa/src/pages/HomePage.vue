<template>
  <div class="flex-1">
    <div align="center" class="links mt-5">
      <table width="740" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td colspan="2">
            <img
              src="/assets/img/homepage/transparent.gif"
              style="width: 62px; height: 19px"
            /><img
              src="/assets/img/homepage/tag-bar.gif"
              style="width: 469px; height: 19px"
            />
          </td>
        </tr>
        <tr>
          <td width="301">
            <img
              src="/assets/img/homepage/transparent.gif"
              style="width: 36px; height: 14px"
            /><img
              src="/assets/img/homepage/online_mid78.gif"
              style="width: 237px; height: 14px"
            />
          </td>
          <td rowspan="7" width="439">
            <img
              src="/assets/img/homepage/welco4.jpg"
              style="width: 434px; height: 263px"
            />
          </td>
        </tr>
        <tr>
          <td width="301">
            <img
              src="/assets/img/homepage/transparent.gif"
              style="width: 26px; height: 119px"
            /><img
              src="/assets/img/homepage/box_anim.gif"
              width="232"
              name="box_blank"
              height="119"
            /><img
              src="/assets/img/homepage/box_midbkl2.gif"
              style="width: 43px; height: 119px"
            />
          </td>
        </tr>
        <tr>
          <td width="301">
            <img
              src="/assets/img/homepage/transparent.gif"
              style="width: 26px; height: 17px"
            /><img
              src="/assets/img/homepage/mid1_box.gif"
              style="width: 232px; height: 17px"
            />
          </td>
        </tr>
        <tr>
          <td width="301">
            <img
              src="/assets/img/homepage/transparent.gif"
              style="width: 26px; height: 21px"
            /><a
              href="#"
              @mouseout="MM_swapImgRestore()"
              @mouseover="
                MM_swapImage('box_blank', '', 'images/box_over_on.gif', 1)
              "
              ><img
                src="/assets/img/homepage/overview_but128.gif"
                style="width: 134; height: 21px"
                name="overview"
                border="0"
                alt="Overview"
            /></a>
          </td>
        </tr>
        <tr>
          <td width="301">
            <a
              href="#"
              @mouseout="MM_swapImgRestore()"
              @mouseover="
                MM_swapImage('box_blank', '', 'images/box_newcom_on.gif', 1)
              "
              ><img
                src="/assets/img/homepage/new_butt128.gif"
                style="width: 166px; height: 26px"
                name="newcomers"
                border="0"
                alt="Newcomers"
            /></a>
          </td>
        </tr>
        <tr>
          <td width="301">
            <a
              href="#"
              @mouseout="MM_swapImgRestore()"
              @mouseover="
                MM_swapImage('box_blank', '', 'images/box_news_on.gif', 1)
              "
              ><img
                src="/assets/img/homepage/city_butt128.gif"
                style="width: 179px; height: 27px"
                name="news"
                border="0"
                alt="City News"
            /></a>
          </td>
        </tr>
        <tr>
          <td width="301">
            <img
              src="/assets/img/homepage/transparent.gif"
              style="width: 46px; height: 45px"
            /><a
              href="#"
              @mouseout="MM_swapImgRestore()"
              @mouseover="
                MM_swapImage('box_blank', '', 'images/box_cal_on.gif', 1)
              "
              ><img
                src="/assets/img/homepage/cal_butt128.gif"
                style="width: 149px; height: 45px"
                name="cal"
                border="0"
                alt="Calendar"
            /></a>
          </td>
        </tr>
      </table>
      <table width="740" border="0" cellspacing="0" cellpadding="0" height="7">
        <tr valign="top">
          <td height="14">
            <img
              src="/assets/img/homepage/transparent.gif"
              style="width: 60px; height: 33px"
            /><img
              src="/assets/img/homepage/visit_visit64.gif"
              style="width: 79px; height: 33px"
            /><a
              href="#"
              @mouseout="MM_swapImgRestore()"
              @mouseover="
                MM_swapImage('box_blank', '', 'images/box_plaza_on.gif', 1)
              "
              onMouseDown="MM_showHideLayers('help','','hide','plazas','','show','clubs','','hide')"
              ><img
                src="/assets/img/homepage/visit_plazat128.gif"
                style="width: 135px; height: 33px"
                border="0"
                alt="Plazas" /></a
            ><a
              href="#"
              @mouseout="MM_swapImgRestore()"
              @mouseover="
                MM_swapImage('box_blank', '', 'images/box_club_on.gif', 1)
              "
              onMouseDown="MM_showHideLayers('help','','hide','plazas','','hide','clubs','','show')"
              ><img
                src="/assets/img/homepage/visit_clubs128.gif"
                border="0"
                alt="Clubs" /></a
            ><a
              href="#"
              @mouseout="MM_swapImgRestore()"
              @mouseover="
                MM_swapImage('box_blank', '', 'images/box_help_on.gif', 1)
              "
              onMouseDown="MM_showHideLayers('help','','show','plazas','','hide','clubs','','hide')"
              ><img
                src="/assets/img/homepage/visit_help128.gif"
                style="width: 100px; height: 33px"
                border="0"
                alt="Help"
            /></a>
          </td>
        </tr>
      </table>
      <table width="740" border="0" cellspacing="0" cellpadding="0" height="7">
        <tr valign="top">
          <td width="519" rowspan="2" height="83" valign="top">
            <div align="right">
              <!-- Start Ad Banner -->
              <div align="center">
                <a href="#"
                  ><img
                    src="/assets/img/homepage/newfeatures.jpg"
                    style="width: 468px; height: 60px"
                    alt="Click here to see the Cybertown New Features!"
                    border="0"
                /></a>
              </div>
            </div>
          </td>
          <td width="221" height="33" colspan="2">
            <a
              href="#"
              @mouseout="MM_swapImgRestore()"
              @mouseover="
                MM_swapImage('box_blank', '', 'images/box_house_on.gif', 1)
              "
              ><img
                src="/assets/img/homepage/ban_house64.gif"
                style="width: 140px; height: 33px"
                border="0"
                alt="My House"
            /></a>
          </td>
        </tr>
        <tr valign="top">
          <td align="right" height="50" colspan="2" width="221">
            <div align="center"></div>
            <table
              width="150"
              border="0"
              cellspacing="0"
              cellpadding="0"
              align="center"
            >
              <tr>
                <td style="line-height: normal">
                  <router-link to="/login"
                    ><font
                      face="Arial, Helvetica, sans-serif"
                      size="2"
                      color="#FFFF00"
                      ><b>LOGIN/JOIN</b></font
                    ></router-link
                  >
                  <br />
                  <font
                    face="Arial, Helvetica, sans-serif"
                    size="1"
                    color="#FFFF00"
                    >Entering though this link will transport you into the
                    <br />Cybertown Plaza.
                  </font>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <table width="740" border="0" cellspacing="0" cellpadding="0">
        <tr>
          <td colspan="3">
            <div align="center">
              <font color="#10A4A8" face="Arial, Helvetica, sans-serif" size="1"
                ><b
                  ><a href="#" class="links"
                    ><span class="links">MY EMAIL</span></a
                  >
                  <span class="links"
                    ><img
                      src="/assets/img/homepage/blue_dot.gif"
                      style="width: 11px"
                    />
                    <a href="#" class="links">LEGAL NOTICES</a>
                    <img
                      src="/assets/img/homepage/blue_dot.gif"
                      style="width: 11px"
                    />
                    <a href="#" class="links">COMPANY INFORMATION</a>
                    <img
                      src="/assets/img/homepage/blue_dot.gif"
                      style="width: 11px"
                    />
                    <a href="#" class="links"> CONTACT</a></span
                  ></b
                ><br />
                <div class="flex justify-center">
                  <h3 class="p-2"><router-link to="/privacypolicy"> Privacy Policy </router-link></h3>
                  <h3 class="p-2"><router-link to="/rulesandregulations"> Rules and Regulations </router-link></h3>
                  <h3 class="p-2"><router-link to="/constitution"> Constitution </router-link></h3>
                </div>
                <h2><router-link to="/about">About Cybertown Revival</router-link></h2>
                <br/>
                <span class="text-ctyellow text-2xl">Fan Made Not For Profit Historical Recreation</span>
                <br/>

               <a
                  href="https://kdaws.com/"
                  target="_blank"
                  class="text-center inline-block p-5 rounded-sm mt-10"
                  style="color: #808080; !important;text-decoration:none"
                >
                  <img
                    src="/assets/img/kda-logo-white.png"
                    style="width: 150px; height: auto; margin-bottom: 5px"
                  />
                  <br />Hosted By KDA Web Services
                </a>
              </font>
            </div>
          </td>
        </tr>
      </table>
      <div
        id="help"
        style="
          position: absolute;
          width: 80px;
          height: 89px;
          z-index: 1;
          left: 505px;
          top: 217px;
          visibility: hidden;
        "
      >
        <a
          href="#"
          @mouseover="MM_showHideLayers('help', '', 'show')"
          @mouseout="MM_showHideLayers('help', '', 'hide')"
          ><img
            src="/assets/img/homepage/menu_helpns.gif"
            style="width: 80px; height: 100px"
            border="0"
            usemap="#help"
        /></a>
      </div>
      <div
        id="plazas"
        style="
          position: absolute;
          width: 100px;
          height: 119px;
          z-index: 1;
          left: 207px;
          top: 187px;
          visibility: hidden;
        "
      >
        <a
          href="#"
          @mouseover="MM_showHideLayers('plazas', '', 'show')"
          @mouseout="MM_showHideLayers('plazas', '', 'hide')"
          ><img
            src="/assets/img/homepage/menu_plazatext.gif"
            style="width: 100px"
            border="0"
            usemap="#plazas"
        /></a>
      </div>
      <div
        id="clubs"
        style="
          position: absolute;
          width: 100px;
          height: 98px;
          z-index: 2;
          left: 398px;
          top: 207px;
          visibility: hidden;
        "
      >
        <a
          href="#"
          @mouseover="MM_showHideLayers('clubs', '', 'show')"
          @mouseout="MM_showHideLayers('clubs', '', 'hide')"
          ><img
            src="/assets/img/homepage/menu_clubstext.gif"
            style="width: 100px; height: 100px"
            border="0"
            usemap="#clubs"
        /></a>
      </div>
      <p>&nbsp;</p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: "Homepage",
  data: () => {
    return {};
  },
  methods: {
    MM_swapImage() {},
    MM_swapImgRestore() {},
  },
  mounted() {
    if (this.$store.data.isUser) {
      this.$router.push({ path: "/place/enter" });
    }
  },
});
</script>

<style>
img {
  display: inline-block !important;
  border-width: 0;
  height: auto;
  width: auto;
}
.links {
  color: #009999 !important;
  text-decoration: none !important;
}
</style>
