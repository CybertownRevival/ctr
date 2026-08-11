<template>
  <main class="p-4">
    <h1 class="text-xl mb-4">Live Event</h1>

    <div class="mb-4">
      <label class="block mb-1">Status</label>
      <select v-model="enabled" class="text-black">
        <option :value="false">Disabled</option>
        <option :value="true">Enabled</option>
      </select>
    </div>

    <div class="mb-4">
      <label class="block mb-1">Destination</label>
      <select v-model="placeId" class="text-black">
        <option :value="null">Select a place</option>
        <option
          v-for="place in places"
          :key="place.id"
          :value="place.id"
        >
          {{ place.name }}
        </option>
      </select>
    </div>

    <button
      class="btn-ui"
      @click="save"
    >
      Save Live Event
    </button>
  </main>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'LiveEvent',
  data: () => {
    return {
      enabled: false,
      placeId: null,
      places: [],
    };
  },
  methods: {
    async loadLiveEvent(): Promise<void> {
      const response = await this.$http.get('/live-event');

      this.enabled = response.data.liveEvent.enabled;

      if (response.data.liveEvent.place) {
        this.placeId = response.data.liveEvent.place.id;
      }
    },
    async loadPlaces(): Promise<void> {
      const response = await this.$http.get(
        '/admin/allplacessearch?search=&compare=!=&type=home&limit=500&offset=0',
      );

      this.places = response.data.results;
    },
    async save(): Promise<void> {
      await this.$http.post('/live-event', {
        placeId: this.placeId,
        enabled: this.enabled,
      });

      alert('Live Event updated successfully.');
    },
  },
  async created() {
    await this.loadLiveEvent();
    await this.loadPlaces();
  },
});
</script>
