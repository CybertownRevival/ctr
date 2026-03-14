<template>
  <div class="folder-container">
    <div class="folder-tabs">
      <button 
        v-for="item in items" 
        :key="item.id"
        :class="['folder-tab', { 'active-tab': activeId === item.id }]"
        @click="activeId = item.id"
      >
        {{ item.name }}
      </button>
    </div>

    <div class="folder-content-box">
      <div v-for="item in items" :key="'content-' + item.id">
        <div v-if="activeId === item.id" class="inner-scroll">
          <p class="text-green">{{ item.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
  name: 'MayorElection',
  data() {
    return {
      activeId: 'ajay', // Default open tab
      items: [
        { id: 'ajay', choice: 1, name: 'EmperorAjay', description: 'information from ajay' },
        { id: 'ms', choice: 2, name: 'MorningStar', description: 'information from MorningStar' },
        { id: 'phil', choice: 3, name: 'phil_00', description: 'information from phil_00' }
      ]
    };
  },
  mounted() {
    this.shuffleItems();
    // Set the first item in the new random order as the active tab
    if (this.items.length > 0) {
      this.activeId = this.items[0].id;
    }
  },
  methods: {
    shuffleItems() {
      let array = this.items;
      for (let i = array.length - 1; i > 0; i--) {
        // Pick a random index from 0 to i
        const j = Math.floor(Math.random() * (i + 1));
        // Swap elements array[i] and array[j]
        [array[i], array[j]] = [array[j], array[i]];
      }
    }
  },
});
</script>
<style scoped>
.folder-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 600px;
  margin: 10px 0;
}

.folder-tabs {
  display: flex;
  gap: 2px;
  padding-left: 5px;
}

.folder-tab {
  /* Matching your .btn-ui style */
  font-family: arial;
  font-size: x-small;
  color: #8f9bb6; 
  border: 1px solid #8f9bb6;
  border-bottom: none;
  border-radius: 5px 5px 0 0;
  background-color: #001829;
  padding: 4px 10px;
  text-transform: uppercase;
  cursor: pointer;
  letter-spacing: 1px;
  transition: color 0.2s;
}

.folder-tab:hover {
  color: #d0dbf7;
}

.folder-tab.active-tab {
  color: #d0dbf7;
  background-color: #001f35; /* Slightly lighter blue-black */
  border-color: #d0dbf7;
  font-weight: bold;
  box-shadow: 0px -2px 5px rgba(0,0,0,0.5);
  position: relative;
  z-index: 10;
}

.folder-content-box {
  /* Matching your .chat and .messages-pane logic */
  border: 1px solid #8f9bb6;
  background-color: #001829;
  box-shadow: -2px 3px black; /* Matches your btn-ui shadow */
  height: 150px;
  position: relative;
  top: -1px; /* Merges the active tab with the box */
}

.inner-scroll {
  padding: 10px;
  height: 100%;
  
  /* Requirements: */
  overflow-y: auto;          /* Scroll Y */
  overflow-x: hidden;        /* No Scroll X */
  word-wrap: break-word;     /* Wrap text */
  overflow-wrap: break-word;
  
  /* Retro Scrollbar styling (optional) */
  scrollbar-color: #8f9bb6 #001829;
  scrollbar-width: thin;
}

/* Optional: custom scrollbar for webkit to match the UI */
.inner-scroll::-webkit-scrollbar {
  width: 6px;
}
.inner-scroll::-webkit-scrollbar-track {
  background: #001829;
}
.inner-scroll::-webkit-scrollbar-thumb {
  background: #8f9bb6;
  border-radius: 3px;
}
</style>