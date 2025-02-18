<template>
  <div class="flex-1 w-full p-5 text-center" v-if="placeId && petFound">
    <div v-if="page === 'update'">
      <div class="text-3xl font-bold">Virtual Pet Behaviour</div>
      <div v-if="error" class="font-bold" style="color:red;">
        <span>{{ errorMessage }}</span>
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
              <td><a href="#" class="flex font-normal" @click.prevent="petHelp">Help</a></td>
            </tr>
            <tr>
              <td>Pet's Avatar URL: </td>
              <td><div class="flex w-full font-normal bg-white text-black"> {{ petURL }}</div></td>
              <td><a href="#" class="font-normal" @set-pet="setPet($event)" @click.prevent="selectPet">Select Avatar URL</a></td>
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
    <div v-else>
      <div class="flex-1 text-center">      
        <p>
          <font color="#FFFF99" size="5">T <font size="4">H E</font></font><font color="#000000">...</font> 
          <font color="#FFFF99" size="5">C <font size="4">Y B E R T O W N</font></font><font color="#000000">...</font> 
          <font color="#FFFF99" size="5">P<font size="4"> E T S</font></font><font color="#000000">...</font><font size="4"> 
          </font><font color="#FFFF99" size="5">G<font size="4"> A L L E R Y</font></font>
        </p>
        <div>
          Click a picture below to choose your Pet
        </div>
        <div class="flex w-full flex-wrap justify-self-center justify-center" style="width:600px;">
          <img class="cursor-pointer" @click="setPet('dog')" src="/assets/pets/dog/dog1.jpg" />
          <img class="cursor-pointer" @click="setPet('cat')" src="/assets/pets/cat/cat.jpg" />
          <img class="cursor-pointer" @click="setPet('alien')" src="/assets/pets/alien/alien.jpg" />
          <img class="cursor-pointer" @click="setPet('bug')" src="/assets/pets/bug/bug.jpg" />
          <img class="cursor-pointer" @click="setPet('bunny')" src="/assets/pets/bunny/bunny.jpg" />
        </div>
      </div>
    </div>
  </div>
  <div class="flex w-full justify-center" v-else>
    <span class="text-2xl font-bold text-center pt-24">Unable to locate place.<br />Please use the navigation panel instead of refreshing.</span>
  </div>
</template>

<script lang="ts">
  import VirtualPetSelect from '@/components/modals/VirtualPetSelect.vue';
import Vue from "vue";
import Modal from '../../components/modals/Modal.vue';
import ModalService from '@/components/modals/services/ModalService.vue';

export default Vue.extend({
  name: "HomeVirtualPet",
  components: {Modal},
  data: () => {
    return {
      loaded: false,
      error: false,
      errorMessage: "",
      success: false,
      placeId: null,
      slug: null,
      petName: "",
      petURL: null,
      activatePet: false,
      petVoice: 0,
      behaviours: [],
      petFound: false,
      page: "update",
      petsURLS: [
      ['/assets/pets/dog/dog.wrl'],
      ['/assets/pets/cat/cat.wrl'],
      ['/assets/pets/alien/alien.wrl'],
      ['/assets/pets/bug/bug.wrl'],
      ['/assets/pets/bunny/bunny.wrl'],
      ],
      pets: ["dog", "cat", "alien", "bug", "bunny", ]
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
          this.errorMessage = "Please enter Pet's Nickname."
          return this.error = true;
        }
        const updatePet = await this.$http.post(`/place/virtual-pet/update/${this.placeId}`, {
          name: this.petName,
          avatar: this.petURL,
          active: this.activatePet,
          voice: this.petVoice,
          behaviours: JSON.stringify(this.behaviours),
        });
        if(updatePet.data.success){
          this.error = false;
          this.errorMessage = '';
          this.success = true;
          this.getPet();
        } else {
          this.error = true;
          this.errorMessage = updatePet.data.error;
          this.success = false;
          this.getPet();
        }
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
    petHelp() {
      window.open("/#/home/virtualpethelp/", "targetWindow", "width=1000px,height=700px,location=0,menubar=0,status=0,scrollbars=0");
    },
    selectPet(){
      this.page = 'select';
    },
    setPet(data){
      this.petURL = String(this.petsURLS[this.pets.indexOf(data)]);
      this.page = 'update';
    },
  },
  created() {
    this.placeId = this.$store.data.place.id;
    this.slug = this.$store.data.place.slug;
    this.getPet()
  },
});
</script>
