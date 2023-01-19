<template>
  <div class="text-center">
    <!-- property/present.tmpl -->
    <h3><strong>Welcome to <$NAM></strong></h3>

    <div class="flex flex-row" >
      <div class="flex flex-auto w-2/3">
        <table border=0 width=100%>
          <tr>
            <td width=130><b>Resident</b></td>
            <td><$ownername></td>
          </tr>

          <tr>
            <td><b>Name</b></td>
            <td><$FNM> <$LNM></td>
          </tr>
          <!-- #ifdef variable="EML" -->
          <!--#if variable="NNM" == variable="MEM_NNM" -->
          <!-- todo IF viewing their own data -->
          <tr>
            <td><b>Email</b></td>
            <td><$EML></td>
          </tr>
          <!--#endif variable="NNM" -->
          <!-- #ifdef variable="isAdmin" -->
          <!-- todo IF admin -->
          <tr>
            <td><b>Email</b></td>
            <td><$EML></td>
          </tr>
          <tr>
            <td><b>Immigration Email</b></td>
            <td><$EMI></td>
          </tr>
          <!-- #endif variable="isAdmin" -->
          <!-- #endif variable="EML" -->

          <tr>
            <td><b>Immigration</b></td>
            <td><$IMD_DAYNAME>, <$IMD_MONNAME> <$IMD_MDAy> <$IMD_YEAR></td>
          </tr>
          <!-- #ifdef variable="LAD_DAYNAME" -->
          <tr>
            <td><b>Last Access</b></td>
            <td><$LAD_DAYNAME>, <$LAD_MONNAME> <$LAD_MDAy> <$LAD_YEAR></td>
          </tr>
          <!-- #endif variable="LAD_DAYNAME" -->
          <tr>
            <td><b>Experience</b></td>
            <td><$EXP></td>
          </tr>

          <tr>
            <!-- #ifdef variable="MON" -->
            <td><b>Money</b>
            </td>
            <td><$MON></td>
          </tr>
          <!-- #endif variable="MON" -->

          <!-- #ifdef variable="HPG" -->
          <tr>
            <td><b>Home Page</b></td>
            <td><a href="<$HPG>" target="external"><$HPG></a></td>
          </tr>
          <!-- #endif variable="HPG" -->
        </table>

      </div>
      <div class="flex-auto w-1/3">
        <!-- #ifdef variable="exists" -->
        <img src="property<$g_exe>?ac=print&ID=<$propid>&type=P&index=&media=i" border=0 alt="">
        <!-- #endif variable="exists" -->
        <!-- #ifdef variable="medialocked" -->
        <img src="<$g_Images>/images/locked.gif" border=0 alt="Your image must be accepted by the block leader first!">
        <br><font color="FFFF00"><small>Your image must be accepted by the block leader first!</small></font>
        <!-- #endif variable="medialocked" -->
        <!-- #ifdef variable="upload" -->
        <small><i>Click Update to upload your personal image!</i></small>
        <!-- #endif variable="upload" -->
        <!-- #ifdef variable="noimage" -->
        <small><i>No image uploaded yet!</i></small>
        <!-- #endif variable="noimage" -->

      </div>
    </div>
    <table border=0 width=100%>
      <tr>
        <td>
          <!-- 1. table for text data -->
        </td>

        <!-- 2. image data -->
        <td width=150>
        </td>

      </tr>
    </table>

  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: "HomeMain2d",
  data: () => {
    return {};
  },
});
</script>

