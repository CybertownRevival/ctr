<template>
  <div class="flex flex-col w-screen items-center">
    <h1 class="mb-5">Admin Update Object</h1>
    <div class="grid grid-cols-2 justify-items-center">
      <div><img style="max-height: 300px; max-width: 300px;" :src="imgFile" /></div>
      <div class="flex flex-col" style="width:400px;">
        <div class="flex w-full">
          <div class="flex w-1/4">ID:</div>
          <div>{{ id }}</div>
        </div>
        <div class="flex w-full">
          <div class="flex w-1/4">Name:</div>
          <div>{{ name }}</div>
        </div>
        <div class="flex w-full">
          <div class="flex w-1/4">Directory:</div>
          <div>{{ directory }}</div>
        </div>
        <div class="flex w-full">
          <div class="flex w-1/4">Filename:</div>
          <div>{{ filename }}</div>
        </div>
        <div class="flex w-full">
          <div class="flex w-1/4">Thumbnail:</div>
          <div>{{ thumbnail }}</div>
        </div>
        <div class="flex w-full">
          <div class="flex w-1/4">Texture:</div>
          <div>{{ texture }}</div>
        </div>
        <div class="flex w-full">
          <div class="flex w-1/4">Creator:</div>
          <div>{{ creator }}</div>
        </div>
        <div class="flex w-full">
          <div class="flex w-1/4">Price:</div>
          <div>{{ price }}</div>
        </div>
        <div class="flex w-full">
          <div class="flex w-1/4">Limit:</div>
          <div v-if="limit >= 1">{{ limit }}</div>
          <div v-else>Unlimited</div>
        </div>
        <div class="flex w-full">
          <div class="flex w-1/4">Quantity:</div>
          <div>{{ quantity }}</div>
        </div>
        <div class="flex w-full">
          <div class="flex w-1/4">Sold:</div>
          <div v-if="sold">{{ sold }}</div>
          <div v-else>0</div>
        </div>
        <div class="flex w-full">
          <div class="flex w-1/4">Status:</div>
          <div>{{ objectState[status] }}</div>
        </div>
      </div>
    </div>
    <div v-if="accessLevel.includes('admin')">
      <table class="my-5">
        <tr>
          <td>Update Name: </td>
          <td class="w-96"><input class="text-black w-full" v-model="newName" type="text" /></td>
        </tr>
        <tr>
          <td>Update Directory: </td>
          <td><input class="text-black w-full" v-model="newDirectory" type="text" /></td>
        </tr>
        <tr>
          <td>Update Filename: </td>
          <td><input class="text-black w-full" v-model="newFilename" type="text" /></td>
        </tr>
        <tr>
          <td>Update Thumbnail: </td>
          <td><input class="text-black w-full" v-model="newThumbnail" type="text" /></td>
        </tr>
        <tr>
          <td>Update Price: </td>
          <td><input class="text-black w-full" v-model="newPrice" type="text" /></td>
        </tr>
        <tr>
          <td>Update Limit: </td>
          <td><input class="text-black w-full" v-model="newLimit" type="text" /></td>
        </tr>
        <tr>
          <td>Update Quantity: </td>
          <td><input class="text-black w-full" v-model="newQuantity" type="text" /></td>
        </tr>
        <tr>
          <td>Update Status: </td>
          <td>
            <select v-model="newStatus">
              <option value="0">Rejected/Deleted</option>
              <option value="2">Pending</option>
              <option value="3">Accepted</option>
              <option value="4">Destocked</option>
            </select>
          </td>
        </tr>
      </table>
      <span class="w-screen" style="color:red;" v-if="error"><center>{{ error }}</center></span>
      <span class="w-screen" style="color:limegreen;" v-if="success"><center>{{ success }}</center></span>
      <button class="btn-ui" @click="updateObject">Update Object</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  name: "AdminObjectUpdate",
  data: () => {
    return {
      id: null,
      name: null,
      directory: null,
      filename: null,
      thumbnail: null,
      texture: null,
      creator: null,
      price: null,
      limit: null,
      quantity: null,
      sold: null,
      status: null,
      imgFile: null,
      newName: null,
      newDirectory: null,
      newFilename: null,
      newThumbnail: null,
      newPrice: null,
      newLimit: null,
      newQuantity: null,
      newStatus: null,
      objectState: ["Rejected", "Stocked", "Pending", "Accepted", "Destocked"],
      accessLevel: "none",
      details: [],
      newDetails: [],
      error: "",
      success: "",
    };
  },
  methods: {
    async getAdminLevel(): Promise<void> {
      try{
        await this.$http.get("/member/getadminlevel")
          .then((response) => {
            this.accessLevel = response.data.accessLevel;
            if (this.accessLevel === "none"){
              this.$router.push({name: "restrictedaccess"});
            }
          });
      } catch (e) {
        console.log(e);
      }
    },
    async objectDetails() {
      const object = await this.$http.get(`/mall/getObject/${this.$route.params.id}`);
      this.id = object.data.object.id;
      this.name = object.data.object.name;
      this.directory = object.data.object.directory;
      this.filename = object.data.object.filename;
      this.thumbnail = object.data.object.image;
      this.texture = object.data.object.texture;
      this.creator = object.data.username;
      this.price = object.data.object.price;
      this.limit = object.data.object.limit;
      this.quantity = object.data.object.quantity;
      this.sold = object.data.object.instances;
      this.status = object.data.object.status;
      this.imgFile = `/assets/object/${this.directory}/${this.thumbnail}`;
      this.newName = this.name;
      this.newDirectory = this.directory;
      this.newFilename = this.filename;
      this.newThumbnail = this.thumbnail;
      this.newPrice = this.price;
      this.newLimit = this.limit;
      this.newQuantity = this.quantity;
      this.newStatus = this.status;
    },
    async updateObject() {
      this.error = "";
      this.success = "";
      this.details = [];
      this.newDetails = [];
      this.details = [
        this.name, this.directory, this.filename, 
        this.thumbnail, this.price, this.limit, 
        this.quantity, this.status];
      this.newDetails = [
        this.newName, this.newDirectory, this.newFilename, 
        this.newThumbnail, this.newPrice, this.newLimit, 
        this.newQuantity, this.newStatus];
      if(JSON.stringify(this.details) !== JSON.stringify(this.newDetails)){
        if((this.directory !== this.newDirectory &&
          this.filename !== this.newFilename &&
          this.thumbnail !== this.newThumbnail) || 
          (this.directory === this.newDirectory &&
          this.filename === this.newFilename &&
          this.thumbnail === this.newThumbnail)){
            try{
              await this.$http.post(`/admin/objects/update`, {
                id: this.id,
                name: this.newName,
                directory: this.newDirectory,
                filename: this.newFilename,
                thumbnail: this.newThumbnail,
                price: this.newPrice,
                limit: this.newLimit,
                quantity: this.newQuantity,
                status: this.newStatus,
              });
              this.success = "Update Successful!"
              this.objectDetails();
            } catch(error) {
              this.error = "Update Failed!";
            }
        } else {
          this.error = "Must change the directory, filename, and thumbnail when fixing the objects files.";
        }
      }
    },
  },
  created() {
    this.getAdminLevel();
  },
  mounted() {
    this.objectDetails();
  }
})
</script>