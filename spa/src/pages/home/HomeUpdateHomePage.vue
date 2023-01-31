<template>
  <div class="h-full w-full bg-black flex flex-col p-2" v-if="loaded">
    <!-- archive template: property/updatehome.tmpl -->
    <template v-if="!hasHome">
      <div class="text-center mb-3">
        <h3>You don't have a home yet.</h3>
        <p>You must first settle into a block before you can update your home.</p>
      </div>
    </template>
    <template v-else>
      <h2>Update your House</h2>
      <p>Choose one of the free <b>2D houses</b> for the map and the <b>3D
        house.</b></p>

      <!-- #include virtual="<$g_Templates>common/updbutton.tmpl" -->

      <p><b>Home Name</b>: <INPUT NAME="NAM" VALUE="<$NAM>" MAXLENGTH=32 SIZE=20> (mandatory)</p>
      <hr />
      <table border=0 width=100%>
        <tr>
          <td valign=top colspan=3><a name="2D"></a><h3>Choose a free 2D House</h3></td>
        </tr>

        <tr>
          <!--#for loopname="2dicons" loopvars="index2i" -->
          <td valign=top width=33%>
            <input type="Radio" name="IC2" value="<$index2i>" <$chk2i>>
            <img src="<$g_HTMLRoot>/home/<$path>block/<$prefix2i><$index2i>.gif" border=0 ALT="<$name2i>" />
            <!--#ifdef variable="name2i" -->
            <br><$name2i>
            <!--#endif variable="name2i" -->
            <!--#ifdef variable="text2i" -->
            <br><$text2i>
            <!--#endif variable="text2i" -->
            <!--<p>Price: <b>$<$price2i></b>-->
          </td>

          <!--#ifdef variable="col3_2i" -->
        </tr>
        <tr>
          <!--#endif variable="col3_2i" -->

          <!--#endfor loopname="2dicons" -->
        </tr>
      </table>

      <table border=0 width=100%>
        <tr>
          <td valign=top colspan=4>
            <hr>
            <h3>Your 3D House</h3>
            Now it's time to choose your fabulous 3D home.
            Please check your bank account at: My Info > Personal Info >Money
            (MyInfo button on Control Panel in right frame) before deciding because
            it's really tough to get a loan around here.
            <p><font color=#FFFF00><b>Note:</b> You need the free download, blaxxun Contact, to view your
              3D home.</font></p>

            <!-- #if variable="IC3" contains value="deshom/dbobjects" -->
            <p><font color=red><b>WARNING:</b> You currently have a custom 3D home. Selecting a new 3D home
              below will <b>permanently</b> remove this.</font></p>
            <p><input type="Radio" name="IC3" value="<$WR3>"
              <!-- #if variable="IC3" contains value="deshom/dbobjects" -->
              checked
              > <b>Designer Home</b>
            <p>
              <!-- #endif variable="IC3" -->

          </td>
        </tr>

        <tr>
          <td colspan=4>
            <input type="Radio" name="IC3" value="" <$chknone3i>>None<br>
          </td>
        </tr>

        <tr>
          <!--#for loopname="3dicons" loopvars="index3i" -->
          <td valign=top width=50%>
            <input type="Radio" name="IC3" value="<$index3i>" <$chk3i>>
            <img src="<$g_HTMLRoot>/home/<$path>block/<$prefix3i><$index3i>.gif" border=0 ALT="<$name3i>">
            <!--#ifdef variable="name3i" -->
            <br><$name3i>
            <!--#endif variable="name3i" -->
            <!--#ifdef variable="text3i" -->
            <br><$text3i>
            <!--#endif variable="text3i" -->
            <p>Price: <b>$<$price3i></b>
          </td>
          <td width=10>&nbsp;</td>

          <!--#ifdef variable="col2_3i" -->
        </tr><tr><td height=10>&nbsp;</td></tr><tr>
        <!--#endif variable="col2_3i" -->

        <!--#endfor loopname="3dicons" -->




      </tr>

        <!-- #ifndef variable="index3i0" -->
        No 3D Houses available!
        <!-- #endif variable="index3i0" -->
        </tr>

        <!-- #if variable="WR3" == value="101" -->
        <tr>
          <td valign=top colspan="3" align=center>
            <input type="Radio" name="IC3" value="101" checked>
            <img src="<$g_HTMLRoot>/home/<$path>block/Picon3D101.gif" border=0 ALT="<$name3i>">
            <br>Intel<sup>&reg;</sup> WebOutfitter<sup>(SM) 3D Home
            <p>Price: <b>$200</b>
          </td>
        </tr>
        <!-- #endif variable="WR3" -->

        <!-- #if variable="WR3" == value="102" -->
        <tr>
          <td valign=top colspan="3" align=center>
            <input type="Radio" name="IC3" value="102" checked>
            <img src="<$g_HTMLRoot>/home/<$path>block/Picon3D102.gif" border=0 ALT="<$name3i>">
            <br>Intel<sup>&reg;</sup> WebOutfitter<sup>(SM) 3D Home
            <p>Price: <b>$200</b>
          </td>
        </tr>
        <!-- #endif variable="WR3" -->

        <!-- #if variable="WR3" == value="103" -->
        <tr>
          <td valign=top colspan="3" align=center>
            <input type="Radio" name="IC3" value="103" checked>
            <img src="<$g_HTMLRoot>/home/<$path>block/Picon3D103.gif" border=0 ALT="<$name3i>">
            <br>Intel<sup>&reg;</sup> WebOutfitter<sup>(SM)</sup> 3D Home
            <p>Price: <b>$200</b>
          </td>
        </tr>
        <!-- #endif variable="WR3" -->

        <!-- Special Title homes goes here! -->

        <!-- #if variable="CHKVM" == value="1" -->
        <tr>
          <td valign=top colspan="3" align=center>
            <p><input type="Radio" name="IC3" value="/home/titlehomes/VirtMaster/vmzip.wrl"
              <!-- #if variable="IC3" contains value="home/titlehomes/VirtMaster/" -->
              checked
              <!-- #endif variable="IC3" -->
              > <img src="<$g_HTMLRoot>/home/titlehomes/VirtMaster/vmthumb.jpg" border=0 ALT="Knight Virtual">
              </font><br><b>VirtMaster Home</b>

          </td>
        </tr>
        <!-- #endif variable="CHKVM" -->

        <!-- #if variable="CHKKV" == value="1" -->
        <tr>
          <td valign=top colspan="3" align=center>
            <input type="Radio" name="IC3" value="home/titlehomes/KnightVirtual/kvzip.wrl"
            <!-- #if variable="IC3" contains value="home/titlehomes/KnightVirtual" -->
            checked
            <!-- #endif variable="IC3" -->
            > <img src="<$g_HTMLRoot>/home/titlehomes/KnightVirtual/kvshield.gif" border=0 ALT="Knight Virtual">
            <br><b>Knight Virtual Home</b>
          </td>
        </tr>
        <!-- #endif variable="CHKKV" -->

        <!-- #if variable="CHKSG" == value="1" -->
        <tr>
          <td valign=top colspan="3" align=center>
            <input type="Radio" name="IC3" value="/home/titlehomes/Sage/sage.wrl"
            <!-- #if variable="IC3" contains value="home/titlehomes/Sage" -->
            checked
            <!-- #endif variable="IC3" -->
            > <img src="<$g_HTMLRoot>/home/titlehomes/Sage/sage2d.jpg" border=0 ALT="Sage">
            <br><b>Sage Home</b>
          </td>
        </tr>
        <!-- #endif variable="CHKSG" -->

        <!-- #if variable="CHKGM" == value="1" -->
        <tr>
          <td valign=top colspan="3" align=center>
            <input type="Radio" name="IC3" value="/home/titlehomes/GM/gm.wrl"
            <!-- #if variable="IC3" contains value="home/titlehomes/GM" -->
            checked
            <!-- #endif variable="IC3" -->
            > <img src="<$g_HTMLRoot>/home/titlehomes/GM/gm2d.jpg" border=0 ALT="Grand Master">
            <br><b>Grand Master Home</b>
          </td>
        </tr>
        <!-- #endif variable="CHKGM" -->

      </table>

      <div align=center>
        <hr>
        <a name=submitbutton></a>
        <input type=submit name="yes" value=Update>
        <input type=button name="no" value=Cancel onClick="history.back()">

    </template>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "HomeUpdateHomePage",
  data: () => {
    return {
      loaded: false,
      hasHome: false,
    };
  },
  methods: {
    async getHome() {
      try {
        const homeResponse = await this.$http.get("/member/home");

        this.hasHome = !!homeResponse.data.homeData;
        this.loaded = true;

      } catch(e) {
        console.error(e);
      }

    },
  },
  mounted() {
    this.getHome();
  },
});
</script>
