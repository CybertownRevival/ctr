<template>
	<div v-if="loaded" class="w-full flex-1 text-center p-5">
    <div class="text-center font-bold text-green" v-if="showSuccess">
      {{ this.success }}
    </div>
    <span class="text-red-500" v-if="showError">
      {{ this.error }}
    </span>
    <h3>Objects Pending Approval</h3>

    <table class="mx-auto">
      <thead>
        <tr>
          <th>Object Name</th>
          <th>Image</th>
          <th>WRL</th>
          <th>Price</th>
          <th>Quantity</th>
          <th>Uploader</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(object,key) in objects" :key="key">
          <td>{{ object.name }}</td>
          <td><img :src="'/assets/object/'+object.directory + '/' + object.image" style="max-width:250px;max-height:250px;height:auto;width:auto;"/></td>
          <td><a :href="'/assets/object/'+object.directory + '/' + object.filename" target="_blank">Click to Download</a></td>
          <td class="text-right">{{ object.price }}</td>
          <td class="text-right">{{ object.quantity }}</td>
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
		if (!(await this.checkAdmin())) {
			this.$router.push("/restricted");
      return;
    }

    this.loaded = true;
    this.getResults();
  },
  watch: {
  },
});
</script>