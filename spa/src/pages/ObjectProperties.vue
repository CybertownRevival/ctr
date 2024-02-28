<template>
  <div v-if="this.active === 'model'">
    <button class="btn" style="position: absolute; padding-inline: 10px; z-index: 1; left: 10px; top: 10px;" @click="changeACtive()">BACK</button>
    <div id="objectModel" style="position:absolute; width:100%; height: 100%; z-index: 0; background-color: black; justify-content:center; align-items: center; display:flex; font-size: 3rem;">Loading item...</div>
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
        <div id="thumbnail" class="justify-self-center"></div>
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
          <div>Click <span style="color:limegreen; font-weight:bold; cursor: pointer;" @click="changeACtive()">HERE</span> to view the object in 3D!</div>
          <span style="display:flex;" v-show="this.displayModel">Created by scott99</span>
          <span style="height:5px"></span>
          <span v-show="this.placeId === 0">This object is located in your backpack.</span>
          <span style="height:5px"></span>
          <span>You have {{ this.walletBalance }} CC's.</span>
          <span style="height:20px"></span>
          <span v-show="this.displayModel">Quantity: {{ this.qty }}</span>
          <span v-show="this.price !== null && this.price !== ''">Price: {{ this.price }} CC's</span>
          <span v-show="this.price !== null && this.price !== '' && this.buyer !=='' && this.buyer !==null">Reserved for {{ this.buyer }}</span>
          <span style="height:20px"></span>
          <div class="objectOwner grid" style="gap:.5rem;" v-show="this.sessionId === this.memberId">
            <div style="display:flex;"><div style="min-width:70px;">Name: </div><span id="nameChange"></span></div>
            <div id="qty" style="display:flex;"><div style="min-width:70px;">Price: </div><span id="priceChange"></span></div>
            <div style="display:none;"><div style="min-width:70px;">Qty: </div><span id="qtyChange"></span></div>
            <div style="display:flex;"><div style="min-width:70px;">Buyer: </div><span id="buyerChange"></span></div>
          </div>
      </div>
    </div>
    <div style="display: flex; justify-content: center;">
      <button  type="button" class="btn" style="margin-inline: 5px; margin-top: 40px;" @click="changeDetails()" v-if="this.sessionId === this.memberId">Update</button>
      <button  type="button" class="btn" style="margin-inline: 5px; margin-top: 40px;" 
        v-if="
        this.sessionId !== this.memberId && this.price !== '' && this.buyer === this.$store.data.user.username ||
        this.sessionId !== this.memberId && this.price !== '' && this.buyer === ''">
        Buy
      </button>
      <button type="button" class="btn" style="margin-inline: 5px; margin-top: 40px;" onclick="window.close()">Close</button></div>
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
      objectId: null,
      placeId: null,
      filename: "",
      directory: "",
      originalName: "",
      name: "",
      error: "",
      success: "",
      walletBalance: null,
      canModify: false,
      displayModel: false,
      price: null,
      buyer: null,
      qty: null,
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
        this.filename = object.filename.split(".", 1);
        this.directory = object.directory;
        this.memberId = object.member_id;
        this.sessionId = this.$store.data.user.id;
        this.placeId = object.place_id;
        this.originalName = object.name;
        this.name = object.object_name;
        this.price = object.object_price;
        this.buyer = object.object_buyer;

        if(this.sessionId === this.memberId){
          this.canModify = true;
        }
        if(this.price === null){
          this.price = '';
        }
        if(this.buyer === null){
          this.buyer = '';
        }
        if(this.displayModel){
          const qty = document.getElementById('qty');
          const qtyInput = document.getElementById('qtyChange');
          qty.style.display= "flex";
          qtyInput.innerHTML= `<input style="color:black;" type="input" id="objectPrice" value="${this.qty}" />`;
        }
        this.loadData();
        this.getOwner();
      });
  },
  async getOwner(){
    const ownerInfo = await this.$http.get(`/member/info/${this.memberId}`);
    this.memberUsername = ownerInfo.data.memberInfo.username;
  },
  async loadData(){
    const thumbnail = document.getElementById("thumbnail");
    const nameInput = document.getElementById("nameChange");
    const priceInput = document.getElementById("priceChange");
    const buyerInput = document.getElementById("buyerChange");

    thumbnail.innerHTML = `<img src="/assets/object/${this.directory}/${this.filename}.jpeg" />`;
    nameInput.innerHTML = `<input style="color:black;" type="text" v-model="objectName" id="objectName" value="${this.name}"/>`;
    priceInput.innerHTML = `<input style="color:black;" type="input" id="objectPrice" value="${this.price}" />`;
    buyerInput.innerHTML = `<input style="color:black;" type="input" id="objectBuyer" value="${this.buyer}" />`;

  },
  changeDetails() {
    this.name = (<HTMLInputElement>document.getElementById('objectName')).value.replace(/[^0-9a-zA-Z \-\[\]()]/g, '');
    this.price = (<HTMLInputElement>document.getElementById('objectPrice')).value.replace(/[^0-9]/g, '');
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
  loadObjectModel() {
    const objectModel = document.getElementById('objectModel');
    objectModel.innerHTML = `<iframe src="/assets/object/ObjectPreview.htm?dir=${this.directory}&&file=${this.filename}" style="height:100%; width: 100%;"></iframe>`;
  },
  async update(): Promise<void> {
    try{
      await this.$http.post(`/object_instance/update/`, {
        id: this.objectId,
        name: this.name,
        price: this.price,
        buyer: this.buyer,
      });
      this.success = 'Object properties have been updated successfully!';
      this.error = '';
    } catch (error) {
      this.error = 'Updating the object details has failed.';
      this.success = '';
      console.error(error); 
    }
  },
  changeACtive(){
    switch (this.active) {
      case "properties":
        this.active = "model";
        setTimeout(this.loadObjectModel, 1000);
        break;
      case "model":
        this.active = "properties";
        this.objectProperties();
        const objectModel = document.getElementById('objectModel');
        objectModel.innerHTML = "";
        break;
    }
  },
},
mounted() {
  this.objectProperties();
}
});

</script>