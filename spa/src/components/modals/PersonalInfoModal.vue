<template>
  <Modal>
    <template v-slot:header>
      <button type="button" class="btn-ui-inline" @click="close('Modal closed')">X</button>
      <button type="button" class="btn-ui-inline" @click="backToInfoModal">&lt;</button>
    </template>
    <template v-slot:body>
      <div class="flex-1">
        <div style="color: #00df00" v-if="success">{{ success }}</div>
        <div style="color: darkred" v-if="error">{{ error }}</div>
        <h3 class="text-center text-2xl">Personal Info</h3>
        <table border=0 width=100% class="text-2xl">
          <tr>
              <td><b>Name</b></td>
              <td>{{ info.username}}</td>
            </tr>
            <tr>
              <td><b>Email</b></td>
              <td>{{ info.email }}</td>
            </tr>
          <tr>
              <td><b>First Name</b></td>
              <td><input type="text" class="input-text" maxlength="20" size="20" v-model="info.firstName"/></td>
          </tr>
          <tr>
              <td><b>Last Name</b></td>
              <td><input type="text" class="input-text" maxlength="32" size="20" v-model="info.lastName"/></td>
          </tr>
            <tr>
              <td><b>Immigration</b></td>
              <td>{{ info.immigrationDate | dateFormatFilter }}</td>
            </tr>
            <tr>
              <td><b>Experience</b></td>
              <td>{{ info.xp }} xp</td>
            </tr>
            <tr>
              <td><b>Money</b></td>
              <td>{{ info.walletBalance }} CC</td>
            </tr>
            <tr>
              <td><b>Primary Job</b></td>
              <td v-if="roles.length === 0">
                No jobs reported as of now
              </td>
              <td v-if="roles.length != 0"><select v-model="selectedRoleId">
                <option v-for="role in roles" :key="role.id" :value="role.id">
                  {{ role.name }}
                </option>
              </select>
              </td>
            </tr>
        </table>
        <div class="text-center flex-1">
          <p>
          <button class="btn" v-on:click="update">
            Update Information
          </button>
          </p>
        </div>
      </div>
    </template>
  </Modal>
</template>
<script lang="ts">
import Vue from "vue";
  
import Modal from "./Modal.vue";
import ModalMixin from "./mixins/ModalMixin";
  
import InfoModal from "./InfoModal.vue";
import ModalService from "./services/ModalService.vue";

export default Vue.extend({
  name: "PersonalInfoModal",
  components: {Modal},
  async created() {
    const { data } = await this.$http.get("/member/info");
    this.info = data.memberInfo;
    this.selectedRoleId = this.info.primary_role_id;
    await this.$http.get("/member/roles").then((response) => {
      this.roles = response.data.roles;
    });
  },
  data: () => {
    return {
      error: undefined,
      info: {
        username: undefined,
        email: undefined,
		firstName: undefined,
		lastName: undefined,
        immigrationDate: undefined,
        walletBalance: undefined,
        xp: undefined,
        primary_role_id: undefined,
      },
      roles: [],
      selectedRoleId: null,
      success: undefined,
    };
  },
  methods: {
    backToInfoModal(): void {
      ModalService.open(InfoModal);
    },
    update(): void {
      try {
        this.$http.post("/member/update_role", {
          primaryRoleId: this.selectedRoleId,
        });
        this.$http.post("/member/updatename", {
	  firstName: this.info.firstName,
	  lastName: this.info.lastName,
        });
        this.error = null;
        this.success = "Information Updated";
      }catch (error) {
        this.success = null;
        this.error = error;
      }
    },
  },
  mixins: [ModalMixin],
});
</script>
