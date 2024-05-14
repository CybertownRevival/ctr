<template>
  <div v-if="this.active === 'model'">
    <button class="
    btn
    absolute
    p-2.5
    left-2.5
    top-2.5
    z-20" 
    @click="reload()">BACK</button>
    <div id="objectModel" class="
    flex
    absolute
    w-full
    h-full
    bg-black
    justify-center
    items-center
    text-5xl
    z-10"></div>
  </div>
  <div v-else
  id="objectProperties" class="
  w-full 
  flex-1 
  h-full 
  items-center 
  justify-center
  ">
    <div class="
    grid
    m-auto
    inset-x-0
    w-4/5
    " 
    style="
      grid-template-rows: 60px 450px auto;
      min-width:600px; 
    ">
      <div class="
      flex
      w-11/12
      justify-center
      text-3xl
      font-bold
      ">
      <span>Object Properties</span>
      </div>
      <div class="grid" style="
        grid-template-columns: 450px auto;
      ">
        <div id="thumbnail" class="justify-self-center"><img :src="imgFile" /></div>
        <div class="
        flex
        flex-col
        text-lg
        pl-6
        w-11/12
        gap-x-4
        "
        style="min-width: 450px;">
          <span id=name class="font-bold text-3xl">{{ this.name }}</span>
          <div>Click <span class="font-bold cursor-pointer" style="color:lime" @click="changeACtive()">HERE</span> to view the object in 3D!</div>
          <span class="h-1.5"></span>
          <span v-if="this.placeId === 0 && this.ownerId === this.sessionId">This object is located in your backpack.</span>
          <span v-else-if="this.ownerId !== this.sessionId && this.placeId === 0">This object is located in {{ this.memberUsername }}'s backpack.</span>
          <span v-else-if="!this.mallObject && this.ownerId !== this.sessionId">This object is owned by {{ this.memberUsername }}.</span>
          <span class="h-1.5"></span>
          <span>You have {{ this.walletBalance }} CC's.</span>
          <span class="h-5"></span>
          <span v-show="this.price !== null && this.price !== ''">Price: {{ this.price }} CC's</span>
          <span v-show="this.price !== null && this.price !== '' && this.buyer !=='' && this.buyer !==null">Reserved for {{ this.buyer }}</span>
          <span class="h-5"></span>
          <div class="objectOwner grid gap-2" v-show="canModify">
            <div class="flex"><div style="min-width: 70px;">Name: </div><input style="color:black;" type="text" id="objectName" :value="name" /></div>
            <div class="flex"><div style="min-width: 70px;">Price: </div><input style="color:black;" type="text" id="objectPrice" maxlength="7" :value="price" /></div>
            <div class="flex"><div style="min-width: 70px;">Buyer: </div><input style="color:black;" type="text" id="objectBuyer" :value="buyer" /></div>
          </div>
      </div>
    </div>
    <span class="flex w-full justify-center text-red-600 mt-10" v-show="error">{{ this.error }}</span>
    <span class="flex w-full justify-center" style="color: lime;" v-show="success">{{ success }}</span>
    <div class="flex justify-center">
      <button  type="button" class="btn mx-1 mt-10" @click="changeDetails()" v-show="this.canModify">Update</button>
        <button  type="button" class="btn mx-1 mt-10" 
          v-if="
          this.sessionId !== this.ownerId && this.price !== '' && (this.buyer === '' || this.buyer === this.$store.data.user.username) && this.walletBalance >= this.price" @click="buy()">
          Buy
        </button>
      <button type="button" class="btn mx-1 mt-10" @click="close()">Close</button></div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "ObjectProperties",
  data: () => {
    return {
      sessionId: null,
      memberId: null,
      memberUsername: null,
      ownerId: null,
      objectId: null,
      placeId: null,
      imgFile: null,
      objectFile: null,
      originalName: "",
      name: "",
      error: "",
      showError: false,
      success: "",
      walletBalance: null,
      canModify: false,
      price: null,
      buyer: null,
      active: "properties",
    };
  },
methods: {
  async objectProperties(): Promise<void>{
    const url = window.location.href.split("/");
    this.objectId = url[url.length - 1];
    const info = await this.$http.get(`/member/info/${this.$store.data.user.id}`);
    this.walletBalance = info.data.memberInfo.walletBalance;
    
    return await this.$http.post(`/object_instance/${ this.objectId }/properties/`)
      .then((response) => {
        let object = response.data.objectInstance[0];
        this.imgFile = `/assets/object/${object.directory}/${object.image}`;
        this.objectFile = `/assets/object/${object.directory}/${object.filename}`;
        this.ownerId = object.member_id;
        this.sessionId = this.$store.data.user.id;
        this.placeId = object.place_id;
        this.originalName = object.name;
        this.name = object.object_name;
        this.price = object.object_price;
        this.buyer = object.object_buyer;
        this.memberUsername = object.username;
        if(this.sessionId === this.ownerId){
          this.canModify = true;
        }
        if(this.price === null){
          this.price = '';
        }
        if(this.buyer === null){
          this.buyer = '';
        }
      });
  },
  reload(){
    window.location.reload();
  },
  close(){
    window.close();
  },
  changeDetails() {
    this.name = (<HTMLInputElement>document.getElementById('objectName')).value.replace(/[^0-9a-zA-Z \-\[\]()]/g, '');
    this.price = (<HTMLInputElement>document.getElementById('objectPrice')).value.replace(/[^0-9]/g, '');
    const badwords = require("badwords-list");
    const bannedwords = badwords.regex;
    if (this.name.match(bannedwords)) {
      alert('You can not use this type of language on CTR!');
      this.name = this.originalName;
    }
    if(this.name === ""){
      this.name = this.originalName;
    }
    if(this.price === ""){
      this.price = null;
    }
    this.buyer = (<HTMLInputElement>document.getElementById('objectBuyer')).value;
    if(this.buyer === ""){
      this.buyer = null;
    }
    this.update();
  },
  loadObjectPreview() {
    const browser = X3D.createBrowser();
    document.querySelector("#objectModel").appendChild(browser);
    const objectURL = '/assets/object/ObjectPreview.wrl';
    const objectViewer = X3D.getBrowser();
    objectViewer.loadURL(new X3D.MFString(objectURL));
    setTimeout(this.loadObject, 3000);
  },
  loadObject(){
    console.log('adding object');
    const browser = X3D.getBrowser();
    const inline = browser.currentScene.createNode("Inline");
    inline.url = new X3D.MFString(this.objectFile);
    browser.currentScene.addRootNode(inline);
  },
  async update(): Promise<void> {
    this.success = 'Object updated';
    await this.$http.post(`/object_instance/update/`, {
      id: this.objectId,
      name: this.name,
      price: this.price,
      buyer: this.buyer,
    });
  },
  changeACtive(){
    switch (this.active) {
      case "properties":
        this.active = "model";
        setTimeout(this.loadObjectPreview, 100);
        break;
    }
  },
  async buy(){
    if(this.walletBalance >= this.price){
      try{
        const objectPurchase = await this.$http.post(`/object_instance/buy/`, {
          id: this.objectId});
          await this.objectProperties();
          this.success = 'Object purchased!';
          this.error = '';
        } catch(error) {
          console.log(error)
          await this.objectProperties();
          if(!this.price){
            this.error = 'This object is not for sale!'
          }
          if(this.buyer && this.$store.data.user.username !== this.buyer) {
            this.error = 'This object is reserved for someone else!';
          }
          if(this.price > this.walletBalance){
            this.error = "You don't have enough cc's.";
          }
        }
    } else {
      this.error = "You don't have enough cc's.";
    }
  }
},
mounted() {
  this.objectProperties();
}
});

</script>
