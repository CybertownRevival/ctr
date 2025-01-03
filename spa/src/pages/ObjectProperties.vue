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
      <span class="flex w-full justify-center">Object Properties</span>
      </div>
      <div class="grid" style="
        grid-template-columns: 450px auto;
      ">
        <div id="thumbnail" class="justify-self-center"><img style="max-height: 450px; max-width: 450px;" :src="imgFile" /></div>
        <div class="
        flex
        flex-col
        text-lg
        pl-6
        w-11/12
        gap-x-4
        "
        style="min-width: 450px;">
          <span id=name class="font-bold text-3xl">
            {{ this.name }}
          </span>
          <div>
            Click 
            <span 
            class="font-bold cursor-pointer" 
            style="color:lime"
            @click="changeACtive()">
              HERE
            </span> 
            to view the object in 3D!
          </div>
          <span class="h-1.5"></span>
          <span v-if="
          this.placeId === 0 && 
          this.ownerId === this.sessionId">
            This object is located in your backpack.
          </span>
          <span v-else-if="
          this.ownerId !== this.sessionId && 
          this.placeId === 0">
            This object is located in {{ this.memberUsername }}'s backpack.
          </span>
          <span v-else-if="
          !this.mallObject && 
          this.ownerId !== this.sessionId">
            This object is owned by {{ this.memberUsername }}.
          </span>
          <span class="h-1.5"></span>
          <span>
            You have {{ this.walletBalance }} CC's.
          </span>
          <span class="h-5"></span>
          <span v-show="this.mallObject">
            Qty: {{ this.quantity - this.instances }}
          </span>
          <span v-show="
          this.mallObject || 
          this.price !== null && 
          this.price !== ''">
            Price: {{ this.price }} CC's
          </span>
          <span v-show="
          this.price !== null && 
          this.price !== '' && 
          this.buyer !=='' && 
          this.buyer !==null">
            Reserved for {{ this.buyer }}
          </span>
          <span class="h-5"></span>
          <span v-show="this.mallObject">
            Created by {{ this.memberUsername }}
          </span>
          <div class="objectOwner grid gap-2" v-show="canModify">
            <div class="flex">
              <div style="min-width: 70px;">Name: </div>
              <input style="
              color:black;" 
              type="text" 
              id="objectName" 
              :value="name" />
            </div>
            <div class="flex" v-show="this.mallObject">
              <div style="min-width: 70px;">Quantity: </div>
              <input style="
              color:black;" 
              type="text" 
              id="objectQty" 
              maxlength="7" 
              :value="quantity" />
            </div>
            <div class="flex">
              <div style="min-width: 70px;">Price: </div>
              <input style="
              color:black;" 
              type="text" 
              id="objectPrice" 
              maxlength="7" 
              :value="price" />
            </div>
            <div class="flex">
              <div style="min-width: 70px;">Buyer: </div>
              <input style="
              color:black;" 
              type="text" 
              id="objectBuyer" 
              :value="buyer" />
            </div>
          </div>
      </div>
    </div>
    <span class="
    flex 
    w-full 
    justify-center 
    text-red-600 
    mt-10" 
    v-show="error">
      {{ this.error }}
    </span>
    <span class="
    flex 
    w-full 
    justify-center" style="color: lime;" 
    v-show="success">
      {{ success }}
    </span>
    <div class="flex justify-center">
      <button  
      type="button" 
      class="btn mx-1 mt-10" 
      @click="changeDetails()" 
      v-if="this.canModify">
        Update
      </button>
      <button  
      type="button" 
      class="btn mx-1 mt-10" 
        v-if="
        this.mallObject && 
        this.instances !== this.quantity && 
        showBuyButton ||
        this.sessionId !== this.ownerId && 
        this.price !== '' && 
        (
          this.buyer === '' || 
          this.buyer === this.$store.data.user.username
        ) &&
         this.walletBalance >= this.price && 
         showBuyButton" 
         @click="buyButtonClicked(), buy()">
        Buy
      </button>
      <span 
      v-else-if="
      !this.mallObject ||
      this.mallObject && 
      this.instances === this.quantity"></span>
      <button 
      type="button" 
      class="btn mx-1 mt-10" 
      v-else>Buy</button>
      <button 
      type="button" 
      class="btn mx-1 mt-10" 
      @click="close()">
        Close
      </button>
    </div>
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
      quantity: null,
      price: null,
      buyer: null,
      instances: 0,
      active: "properties",
      mallObject: false,
      showBuyButton: true,
    };
  },
methods: {
  async objectProperties(): Promise<void>{
    if(this.$route.name === 'mall-object-properties'){
      this.mallObject = true;
    }
    this.objectId = this.$route.params.object_id;
    const info = await this.$http.get(`/member/info/${this.$store.data.user.id}`);
    this.walletBalance = info.data.memberInfo.walletBalance;
    if(this.mallObject){ 
      if(!this.showBuyButton){
        setTimeout(() => {this.showBuyButton = true;}, 1000);     
      }
      await this.$http.get(`/mall/object/${ this.objectId }`)
        .then((response) => {
          let object = response.data.object[0];
          this.imgFile = `/assets/object/${object.directory}/${object.image}`;
          this.objectFile = `/assets/object/${object.directory}/${object.filename}`;
          this.name = object.name;
          this.quantity = object.quantity;
          this.price = object.price;
          this.memberUsername = object.username;
          this.instances = object.instances;
        })
    } else {
    return await this.$http.get(`/object_instance/${ this.objectId }/properties/`)
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
        this.canModify = false;
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
     }
  },
  reload(){
    window.location.reload();
  },
  close(){
    window.close();
  },
  buyButtonClicked(){
    this.showBuyButton = false;
  },
  async changeDetails() {
    this.name = (<HTMLInputElement>document.getElementById('objectName')).value.replace(/[^0-9a-zA-Z \-\[\]\/()]/g, '');
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
    await this.update();
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
  async update() {
    this.success = 'Object updated';
    setTimeout(this.emitUpdate, 300);
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
  startSocketListeners(){
    this.$socket.on("update-object", object => {
      if(object.obj_id === this.objectId){
        this.objectProperties();
      }
    });
  },
  async buy(){
    if(!this.mallObject){
      if(this.walletBalance >= this.price){
        try{
            await this.objectProperties();
            if(!this.price && this.price < 0){
              throw new Error('This object is not for sale!')
            }
            if(this.buyer && this.$store.data.user.username !== this.buyer) {
              throw new Error('This object is reserved for someone else!');
            }
            if(this.price > this.walletBalance){
              throw new Error("You don't have enough cc's.");
            }
            await this.$http.post(`/object_instance/buy/`, {
            id: this.objectId});
            this.emitUpdate();
            await this.objectProperties();
            this.success = 'Object purchased!';
            this.error = '';
          } catch(e) {
            this.success = '';
            this.error = "Purchase failed to process.";
            console.log("Purchase Unsuccessful");
          }
      } else {
        throw new Error("You don't have enough cc's.");
      }
    } else {
      if(this.walletBalance >= this.price) {
        try{
          await this.$http.post(`/mall/buy/`, {
            id: this.objectId});
          this.success = 'Object purchased!';
          await this.objectProperties();
        } catch(e) {
          console.log("Purchase Unsuccessful");
        }
      }
    }
  },
  emitUpdate(){
    this.$socket.emit('update-object', {
      obj_id: this.objectId,
      place_id: this.placeId,
      member_username: this.memberUsername,
      buyer_username: this.$store.data.user.username,
    });
  },
},
created(){
  this.objectProperties();
},
mounted() {
  this.startSocketListeners();
},
});

</script>
