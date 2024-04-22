<template>
	<div v-if="loaded" class="w-full flex-1 text-center p-5">
    <div class="text-center font-bold text-green" v-if="showSuccess">
      {{ this.success }}
    </div>
    <span class="text-red-500" v-if="showError">
      {{ this.error }}
    </span>
    <h3 v-show="window === 'list'">Objects Pending Approval</h3>
    <button type="button" class="btn" @click="changeWindow()" v-show="window === 'object'">Back to Pending</button>
    <div v-show="window === 'object'"><img :src="previewImg" /></div>
    <table class="mx-auto" v-show="window === 'list'">
      <thead>
        <tr>
          <th>Object Name</th>
          <th>Image</th>
          <th>WRL</th>
          <th>Texture</th>
          <th>Price</th>
          <th>Qty</th>
          <th>Uploader</th>
          <th style="min-width: 130px;">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(object,key) in objects" :key="key" class="border-2 border-solid border-gray-200">
          <td>{{ object.name }}</td>
          <td><button type="button" class="btn" @click="changeWindow(), preview(object.image, object.directory)">Thumbnail</button> </td>
          <td><button type="button" class="btn" @click="getWrlFile(object.filename, object.directory)">Object</button></td>
          <td><button v-if="object.texture !== null" type="button" class="btn" @click="changeWindow(), preview(object.texture, object.directory)">Texture</button></td>
          <td class="text-center">{{ object.price }}</td>
          <td class="text-center">{{ object.quantity }}</td>
          <td>{{ object.username }}</td>
          <td>
            <button type="button" class="btn" @click="approve(object.id)">Approve</button>
            <button type="button" class="btn" @click="reject(object.id)">Reject</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "MallApprovalpage",
  data: () => {
    return {
      canAdmin: false,
      objects: [],
      showError: false,
      error: '',
      success: '',
      showSuccess: false,
      loaded: false,
      window: "list",
      previewImg: null,
    };
  },
  methods: {
    async getResults(): Promise<void> {
      try {
        const response = await this.$http.get("/mall/pending_approval");
        this.objects = response.data.objects;
        this.showSuccess = true;
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
    changeWindow(){
      if(this.window === 'list'){
        this.window = "object";
      } else {
        this.window = 'list';
      }
    },
    preview(...target){
      this.previewImg = `/assets/object/${target[1]}/${target[0]}`;
    },
    getWrlFile(...target){
      window.location.assign(`/assets/object/${target[1]}/${target[0]}`);
    },
    async approve(objectId): Promise<void> {
      this.showSuccess = false;
      this.showError = false;
      try {
        await this.$http.post("/mall/approve", {
          'id': objectId
        });
        this.success = 'Object Approved';
        this.showSuccess = true;
        this.getResults();
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
    async reject(objectId): Promise<void> {
      this.showSuccess = false;
      this.showError = false;
      try {
        await this.$http.post("/mall/reject", {
          'id': objectId
        });
        this.success = 'Object Rejected';
        this.showSuccess = true;
        this.getResults();
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
		async checkAdmin(): Promise<boolean> {
      try {
        await this.$http.get(
          `/mall/can_admin`,
        );
        return true;
      } catch (e) {
        console.log(e);
        return false;
      }
    },
  },
	async mounted(): Promise<void> {
    this.loaded = true;
    this.getResults();
  },
  watch: {
  },
});
</script>
