<template>
  <div class="text-center p-5"
       v-if="loaded">
    <div class="text-center">
      <h2>Designer Homes Upload</h2>
    </div>

    <div v-if="!uploadEnabled" class="text-red-500 my-5">
      Designer Homes uploading is currently closed. Please check back later.
    </div>
    <div v-else-if="banned" class="text-red-500 my-5">
      You are banned from uploading Designer Homes.
    </div>
    <template v-else>
      <p>
        Use this form to upload your own 3D home design and offer it for sale in one of the
        Designer Homes stores. Every upload is checked by the Designer Homes staff before it
        goes on sale, and you receive the full price each time a citizen buys your home.
        <br />
        Please read the
        <router-link :to="{ name: 'deshomes-help' }">Designer Homes help</router-link>
        before uploading.
      </p>

      <div class="text-center" v-if="!showSuccess">
        <span class="text-red-500" v-if="error">
          {{ error }}
        </span>

        <table class="mx-auto my-3">
          <tr>
            <td class="text-left">Home Name:</td>
            <td class="text-left">
              <input type="text"
                     v-model="name"
                     class="input-text"
                     maxlength="64" />
            </td>
          </tr>
          <tr>
            <td class="text-left">Price:</td>
            <td class="text-left">
              <input type="number"
                     v-model="price"
                     class="input-text"
                     min="10" />
            </td>
          </tr>
          <tr>
            <td class="text-left">Store:</td>
            <td class="text-left">
              <select v-model="storeId" class="text-black">
                <option :value="null">Choose a store</option>
                <option v-for="store in stores" :key="store.id" :value="store.id">
                  {{ store.name }}
                </option>
              </select>
            </td>
          </tr>
          <tr>
            <td class="text-left">VRML File (.wrl, max 1mb):</td>
            <td class="text-left">
              <input type="file" data-id="wrlFile" @change="setFile" accept=".wrl" />
            </td>
          </tr>
          <tr>
            <td class="text-left">Thumbnail (.jpg, max 80kb):</td>
            <td class="text-left">
              <input type="file" data-id="imageFile" @change="setFile" accept=".jpg,.jpeg" />
            </td>
          </tr>
          <tr v-for="index in maxTextures" :key="index">
            <td class="text-left">Texture {{ index }} (optional, max 256kb):</td>
            <td class="text-left">
              <input type="file"
                     :data-id="`textureFile${index}`"
                     @change="setFile"
                     accept=".jpg,.jpeg,.gif,.png" />
            </td>
          </tr>
        </table>
      </div>

      <p class="text-yellow-200">
        By clicking on Accept & Upload below I hereby affirm that the home I am uploading is an
        original creation by me and does not infringe upon the copyright or trademark of any
        other person or group. I also affirm that it is not an alteration of another's original
        creation without their express permission.
        <br /><br />
        I also understand that should I be discovered to have uploaded a home that is the
        copyright of another, I shall be required to refund the citycash of any other members who
        bought it and that I may also be subject to other penalties per the UBP.
      </p>

      <div class="text-center font-bold text-green-500 my-3" v-if="showSuccess">
        Congratulations! Your home has been uploaded and is awaiting approval.
      </div>
    </template>

    <div align=center>
      <button class="btn"
              :disabled="isProcessing"
              @click="upload"
              v-if="uploadEnabled && !banned && !showSuccess">Accept & Upload</button>
      <button class="btn" @click="reload()" v-if="showSuccess">Upload More</button>
      <router-link to="/place/deshomes"><button class="btn">Back</button></router-link>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "DesignerHomesUploadPage",
  data: () => {
    return {
      loaded: false,
      uploadEnabled: false,
      banned: false,
      stores: [],
      error: "",
      showSuccess: false,
      isProcessing: false,
      maxTextures: 5,
      name: "",
      price: 100,
      storeId: null,
      wrlFile: null,
      imageFile: null,
      textureFile1: null,
      textureFile2: null,
      textureFile3: null,
      textureFile4: null,
      textureFile5: null,
    };
  },
  methods: {
    async getData(): Promise<void> {
      const [statusResponse, storesResponse] = await Promise.all([
        this.$http.get("/designer_home/upload_status"),
        this.$http.get("/designer_home/stores"),
      ]);
      this.uploadEnabled = statusResponse.data.enabled;
      this.banned = statusResponse.data.banned;
      this.stores = storesResponse.data.stores;
      this.loaded = true;
    },
    async upload(): Promise<void> {
      if(this.isProcessing) return;
      this.error = "";
      this.isProcessing = true;

      const data = {
        name: this.name,
        price: this.price,
        storeId: this.storeId ?? "",
      };
      const fileKeys = ["wrlFile", "imageFile"];
      for(let i = 1; i <= this.maxTextures; i++) {
        fileKeys.push(`textureFile${i}`);
      }
      fileKeys.forEach(key => {
        if(this[key]) data[key] = this[key];
      });

      try {
        await this.$http.post("/designer_home/upload", data, true);
        this.showSuccess = true;
      } catch (errorResponse: any) {
        this.error = errorResponse.response?.data?.error ?? "An unknown error occurred";
      }
      this.isProcessing = false;
    },
    setFile(e) {
      const files = e.target.files || e.dataTransfer.files;
      this[e.target.dataset.id] = files[0] ?? null;
    },
    reload() {
      window.location.reload();
    },
  },
  mounted() {
    this.getData();
  },
});
</script>
