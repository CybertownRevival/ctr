<template>
  <div class="flex-1 w-full p-5 text-center" v-if="placeId && petFound">
    <div class="text-3xl font-bold">Virtual Pet Behaviour</div>
    <div v-if="error" class="font-bold" style="color:red;">
      <span v-if="!petName">Please enter Pet's Nickname.</span>
    </div>
    <div v-if="success" class="font-bold" style="color:lime;">
      <span>Pet Updated</span>
    </div>
    <div class="p-5 justify-center text-center text-xl font-bold">
      <div class="grid grid-cols-1 justify-self-center">
        <table>
          <tr>
            <td>Pet's Nickname: </td>
            <td><input type="text" size="40" maxlength="32" class="text-black" v-model="petName" /></td>
            <td><a href="#" class="flex font-normal" @click.prevent="">Help</a></td>
          </tr>
          <tr>
            <td>Pet's Avatar URL: </td>
            <td><input type="text" size="40" maxlength="32" class="text-black" v-model="petURL" /></td>
            <td><a href="#" class="font-normal" @click.prevent="">Select Avatar URL</a></td>
          </tr>
          <tr>
            <td>Activate Pet: </td>
            <td class="flex">
              <input class="pl-2" type="checkbox" v-model="activatePet" />
              <div class="w-full text-right">
                Pet's Voice Type: 
                <select v-model.number="petVoice">
                  <option value="0">Default Male</option>
                  <option value="4">Male</option>
                  <option value="2">Full Male</option>
                  <option value="3">Aged Male</option>
                  <option value="7">Female</option>
                  <option value="1">Full Female</option>
                  <option value="6">Aged Female</option>
                  <option value="8">Whispering Female</option>
                  <option value="5">Child</option>
                </select>
              </div>
            </td>
            <td></td>
          </tr>
        </table>
        <div class="w-full text-2xl p-5">Behaviour</div>
        <table class="border w-full">
          <tr>
            <td class="border">
              Input Text
            </td>
            <td class="border">
              Say/Action
            </td>
          </tr>
          <tr v-for="behaviour in behaviours" :key="behaviour.id">
            <td class="flex-1 align-top border p-1">
              <input type="text" size="30" maxlength="44" class="text-black" v-model="behaviours[behaviour.id].input" />
              <div class="flex justify-self-start py-2 gap-1 text-sm font-normal">
                <div>Exact: <input :name="behaviour.id" type="radio" value="exact" v-model="behaviours[behaviour.id].match" /></div>
                <div>And: <input :name="behaviour.id" type="radio" value="and" v-model="behaviours[behaviour.id].match" /></div>
                <div>Or: <input :name="behaviour.id" type="radio" value="or" v-model="behaviours[behaviour.id].match" /></div>
                <div>Directly: <input type="checkbox" v-model="behaviours[behaviour.id].directly" /></div>
              </div>
            </td>
            <td class="flex-1 border p-1">
              <textarea cols="40" rows="3" class="text-black" v-model="behaviours[behaviour.id].output"></textarea>
              <div class="flex justify-self-start py-2 gap-1 text-sm font-normal">
                <div>Whisper <input type="checkbox" v-model="behaviours[behaviour.id].whisper" /></div>
                <div>Beam to <input type="checkbox" v-model="behaviours[behaviour.id].beam" /></div>
              </div>
            </td>
          </tr>
        </table>
        <div class="p-5">
          <button class="btn" @click="updatePet">Update</button>
          <button class="btn" @click="$router.go(-1)">Cancel</button>
        </div>
      </div>
    </div>
  </div>
  <div class="flex w-full justify-center" v-else>
    <span class="text-2xl font-bold text-center pt-24">Unable to locate place.<br />Please use the navigation panel instead of refreshing.</span>
  </div>
</template>

<script lang="ts">
  import Vue from "vue";

export default Vue.extend({
  name: "HomeVirtualPet",
  data: () => {
    return {
      loaded: false,
      error: false,
      success: false,
      placeId: null,
      slug: null,
      petName: "",
      petURL: "",
      activatePet: false,
      petVoice: 0,
      behaviours: [],
      petFound: false,
    }
  },
  methods: {
    async getPet() {
      try {
        this.loaded = true;
        const pet = await this.$http.get(`/place/virtual-pet/${this.placeId}`);
        if(pet.data.data.length >= 1){
          this.petFound = true;
          this.behaviours = JSON.parse(pet.data.data[0].pet_behaviours);
          this.petName = pet.data.data[0].pet_name;
          this.petURL = pet.data.data[0].pet_avatar_url;
          this.activatePet = pet.data.data[0].active;
          this.petVoice = pet.data.data[0].pet_voice_id;
        } else {
          this.addPet();
        }
      } catch(e) {
        console.error(e);
      }
    },
    async updatePet(){
      try{
        if(!this.petName){
          this.success = false;
          return this.error = true;
        }
        await this.$http.post(`/place/virtual-pet/update/${this.placeId}`, {
          name: this.petName,
          avatar: this.petURL,
          active: this.activatePet,
          voice: this.petVoice,
          behaviours: JSON.stringify(this.behaviours),
        }).then((res) => {
          if(res){
            this.error = false;
            this.success = true;
            this.getPet();
          }
        })
      } catch(e) {
        console.log(e);
      }
    },
    async addPet(){
      await this.$http.post(`/place/virtual-pet/add/${this.placeId}`)
        .then((res) => {
          if(res){
            this.getPet();
          }
      })
    },
  },
  created() {
    this.placeId = this.$store.data.place.id;
    this.slug = this.$store.data.place.slug;
    this.getPet()
  },
});
</script>