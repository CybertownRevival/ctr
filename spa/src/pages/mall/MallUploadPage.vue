<template>
  <div class="text-center p-5"
       v-if="loaded">
    <div class="text-center">
      <h2>Object Upload</h2>
    </div>
    <p class="text-red-500">
      Before uploading, please read and understand the <router-link to="/mall/rules">Rules for Creating Objects
        for Cybertown</router-link>
      <br />
      These are the technical rules by which your Object will be judged fit or unfit for use in Cybertown.
      <br />
      These Rules contain very important information you need to know, plus some technical tips.
      <br />
      <!--I commented this out because I'm uncertain how this differs from the mall rules.
        
        <a href="http://www.cybertown.com/graphics.html"
         target="_blank">Here are the Graphics and Objects Content Guidelines.</a>
        
        -->
    </p>
    <br />
    <p>
      Use this form to "import" new objects into the community and offer them
      for sale.
      <br />
      Please read the explanation below of the fields in the form before filling the form in.
    </p>
    <p>There is some economics (and therefore risk) involved. It will cost you some of your CCs to
      upload an object, and you'll be hoping to earn enough from sales of your object to make a profit. The
      money involved here is the CCs you earn by being a citizen of Cybertown. Read more below.
    </p>
    <div class="text-center" v-if="showForm">
      <span class="text-red-500" v-if="showError">
        {{ this.error }}
      </span>

      <table class="mx-auto my-3">
        <tr>
          <td class="text-left">Object Name:</td>
          <td class="text-left">
            <input type="text"
                   v-model="name"
                   class="input-text"
                   maxlength="20" />
          </td>
        </tr>
        <tr>
          <td class="text-left">Price:</td>
          <td class="text-left">
            <input type="number"
                   v-model="price"
                   class="input-text"
                   min="10"
                   maxlength="4" />
          </td>
        </tr>
        <tr>
          <td class="text-left">Quantity:</td>
          <td class="text-left">
            <input type="number"
                   v-model="quantity"
                   class="input-text"
                   min="10"
                   maxlength="4" />
          </td>
        </tr>
        <tr>
          <td class="text-left">VRML-File:</td>
          <td class="text-left">
            <input type="file"
                   @change="setFile"
                   data-id="wrlFile"
                   accept=".wrl" />
          </td>
        </tr>
        <tr>
          <td class="text-left">Texture-File:</td>
          <td class="text-left">
            <input type="file"
                   @change="setFile"
                   data-id="textureFile"
                   accept=".jpeg,.jpg" />
          </td>
        </tr>
        <tr>
          <td class="text-left">Thumbnail:</td>
          <td class="text-left">
            <input type="file"
                   @change="setFile"
                   data-id="imageFile"
                   accept=".jpeg,.jpg" />
          </td>
        </tr>
      </table>
    </div>
    <p>
      The object that you are uploading to the virtual shop will remain your
      property. You are giving Cybertown the right, without time limit, of use
      and of distribution to other members of this community. Cybertown does
      not grant the right to demand removal of objects already distributed.
    </p>
    <p class="text-yellow-200">By clicking on Accept & Upload below I hereby affirm that the item I am uploading is an
      original creation by me and does not infringe upon the copyright or trademark of any other person or group. I also
      affirm that it is not an alteration of another's original creation without their express permission.
      <br /><br />
      In case of any dispute with another, I hereby agree to defend, indemnify, and hold harmless Cybertown, its
      officers, directors, employees and agents, from and against any claims, actions or demands, including without
      limitation reasonable legal and accounting fees, resulting or allegedly resulting from my uploading of this object
      or image.
      <br /><br />
      I also understand that should I be discovered to have uploaded an object or image that is the copyright of
      another, I shall be required to refund the citycash of any other members who bought it and that I may also be
      subject to other penalties per the UBP.
    </p>

    <div align=center>
      <div class="text-center font-bold text-green" v-if="showSuccess">
      Congratulations! Your object has been uploaded and is awaiting approval.
    </div>
    <input type="button"
      value="Accept & Upload"
      @click="upload"
      class="btn" v-if="!showSuccess"/>
      <button class="btn" @click="reload()" v-else>Upload More</button>
      <router-link to="/place/mall"><button class="btn">Back</button></router-link>
    </div>

    <hr class="my-3" />

    <h3>Description</h3>
    <p>
      <!-- When you upload an object, you have to pay a percentage of the object's
price for each instance of the object. The more instances you upload,
the lower the percentage, as shown in the table below:
<div align=center>
<table border=1 cellpadding=0 width=40%><tr>
<td><FONT face="Arial, Helvetica, sans-serif" size=-1>&nbsp;Quantity   </td><td><FONT face="Arial, Helvetica, sans-serif" size=-1>&nbsp;Percentage</td> 
</tr><tr>
<td><FONT face="Arial, Helvetica, sans-serif" size=-1>&nbsp;&lt;50        </td><td><FONT face="Arial, Helvetica, sans-serif" size=-1>&nbsp;25%      </td>    
</tr><tr>
<td><FONT face="Arial, Helvetica, sans-serif" size=-1>&nbsp;&lt;100       </td><td><FONT face="Arial, Helvetica, sans-serif" size=-1>&nbsp;20%      </td>
</tr><tr>
<td><FONT face="Arial, Helvetica, sans-serif" size=-1>&nbsp;&lt;200       </td><td><FONT face="Arial, Helvetica, sans-serif" size=-1>&nbsp;15%      </td>
</tr><tr>
<td><FONT face="Arial, Helvetica, sans-serif" size=-1>&nbsp;200 or more</td><td><FONT face="Arial, Helvetica, sans-serif" size=-1>&nbsp;10%      </td> 
</tr></table>
</div> -->
      For each instance of the object that gets sold, 80% of the selling
      price will be credited to you.

    <p>
      If one of your uploaded objects sells well and you want to make more
      instances available, you can increase the number of instances in the
      object's Properties form.
    </p>

    <!-- <p>
<b>Example:</b> You upload 10 instances of a chair at a price of 50 CCs.
Your cost: 10*50/4 = 125 CCs.
For each chair sold, you earn: 50/2 = 25 CCs.
So if you sell 5 (half) of the chairs, you earn 125 CCs and break even.
If you sell all 10 chairs, you earn 250 CCs and double your investment.
70% of the selling price will be credited to you for each chair sold. 
</p> -->

    <p>
      <a name="explain"></a>Below is a brief explanation of the fields in the Object Upload form.
      <br />
    <table style="width:500px;"
           class="mx-auto">
      <tr>
        <td>Name:</td>
        <td>The name of the object you're uploading, e.g. Chair.</td>
      </tr>
      <tr>
        <td>Price:</td>
        <td>The amount of CCs a buyer will have to pay for your object.</td>
      </tr>
      <tr>
        <td>Quantity:</td>
        <td>The number of instances of your object that will be available
          for purchase, i.e. the initial "inventory."</td>
      </tr>
      <tr>
        <td>VRML file:</td>
        <td>Name of the local VRML file that represents your object.</td>
      </tr>
      <tr>
        <td>Texture file:</td>
        <td>Name of a file for an optional texture that can be
          referenced by your VRML file. For instance if your Object has a wood texture, this is the name of the wood image
          file.
          <br />Code Example: <i>ImageTexture { url ["./texture"] }</i>
        </td>
      </tr>
      <tr>
        <td>Thumbnail:</td>
        <td>Name of a 450 x 450 pixel .jpeg or .jpg file showing an image of the VR Object you are uploading.
          This image will be displayed to 2D users.
        </td>
      </tr>
    </table>
    <br />
    The texture file is optional; all other fields must be filled in. After
    you have filled in the fields, click on <b>Upload</b>. If you change your mind,
    click on <b>Close</b>.
    </p>
    <p>Notes:</p>
    <ul>
      <li>Internet Explorer 3.x doesn't support file uploads.</li>
      <li>The maximum VRML file size is 80KB. The "wrl" VRML format is required.</li>
      <li>For textures and thumbnails, the maximum file size is 80KB. The files
          must be in jpeg or jpg format.</li>
      <li>Uploaded objects will be positioned at "eye height" at the world's origin (0, 1.75, 0).</li>
      <li>Try to create objects of "realistic" size, i.e. a table would be perhaps 1 x 2 x 0.8 meters.</li>
    </ul>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "MallUploadPage",
  data: () => {
    return {
      showError: false,
      showForm: true,
      error: '',
      showSuccess: false,
      loaded: false,
      name: '',
      price: 10,
      quantity: 10,
      wrlFile: {},
      imageFile: {},
      textureFile: {},
    };
  },
  methods: {
    async upload(): Promise<void> {
      this.showError = false;
      this.showSuccess = false;

      try {
        await this.$http.post("/object/add", {
          name: this.name,
          price: this.price,
          quantity: this.quantity,
          wrlFile: this.wrlFile,
          textureFile: this.textureFile,
          imageFile: this.imageFile,
        }, true);
        this.showSuccess = true;
        this.showForm = false;
      } catch (errorResponse: any) {
        if (errorResponse.response.data.error) {
          this.error = errorResponse.response.data.error;
          this.showError = true;
        } else {
          this.error = "An unknown error occurred";
          this.showError = true;
        }
      }
    },
    setFile(e) {
      let files = e.target.files || e.dataTransfer.files;
      this[e.target.dataset.id] = files[0];

    },
    reload(){
      window.location.reload();
    },
    close(){
      window.close();
    },
  },
  mounted() {
    this.loaded = true;
  },
  watch: {
  },
});
</script>
