<template>
  <div class="election-wrapper" v-show="loaded">
    <h2 class="election-header">Mayoral Election Ballot</h2>
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

    <div class="vote-section">
      <span v-if="error" class="text-red-500">{{ error }}</span>
      <span v-if="success" class="text-green-500">{{ success }}</span>
      <span v-if="!error && !success">
      <h3 class="vote-title">Cast Your Vote</h3>
      <div class="vote-controls">
        <select v-model="selectedVote" class="vote-select" :disabled="error || success || !eligible">
          <option :value="null" disabled>Select a candidate...</option>
          <option v-for="item in items" :key="'vote-' + item.id" :value="item.choice">
            {{ item.name }}
          </option>
        </select>
        <button class="vote-btn" @click="submitVote" :disabled="selectedVote === null">Submit Vote</button>
      </div>
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import appStore from '@/appStore';
export default Vue.extend({
  name: 'MayorElection',
  data() {
    return {
      activeId: null,
      eligible: false,
      error: null,
      loaded: false,
      selectedVote: null as number | null,
      success: null,
      items: [
        { id: 'ajay', choice: 1, name: 'EmperorAjay', description: 'I am asking for your vote to serve as the next Mayor of Cybertown. ' +
          'We all want Cybertown to succeed and thrive, yet activity has declined and our community is no longer growing the way it should. ' +
          'My opponents are perfectly nice people, but the real question is who will truly lead Cybertown back to growth and prosperity. ' +
          'As the leader of Cyberhood and through my real-life work in public relations, I have always been passionate about recruiting, ' +
          'outreach, and building strong communities. If elected Mayor, I will not accept business as usual or settle for mediocrity, I ' +
          'will work tirelessly to make everyone feel included, revive activity, and bring both returning citizens and new people to Cybertown ' +
          'so it once again becomes the vibrant place we all love.',
        },
        { id: 'ms', choice: 2, name: 'MorningStar', description: 'There are countless places to chat in 2D & play games on the internet so ' +
          'that isn\'t what makes CTR unique & valuable. The sense of long-term community & the ability to be creative & contribute to the ' +
          'energy & artistry of this community, particularly in 3D but in 2D as well, are what make CTR a special place in the metaverse. ' +
          'As a candidate, my interest is in seeing CTR become a viable site that can attract folks based on the finesse of the site & the ' +
          'opportunities afforded to its existing citizens & those we wish to attract into the community. I have suggested that we focus our ' +
          'attention on completing the site & developing niche interests such as building & renovating activities, taking advantage of the ' +
          'skills of the builders & creators at our disposal as well as offering events such as contests, bingo, parties, & others in order ' +
          'to attract new folks to the community. I feel confident that we have what we need to make CTR an ongoing concern; & if we don\'t yet, ' +
          'we can work together to make it happen.'},
        { id: 'phil', choice: 3, name: 'phil_00', description: 'Cybertown has been part of my life for ' + 
          'many years, and the friendships and community here are what keep bringing me back. I\'m running ' +
          'for Mayor because I want to help strengthen the engagement and communication that make this ' +
          'place special. By supporting community events, restarting CVN, and bringing back City/Place of ' +
          'the Month, we can create more opportunities for people to connect and participate. I believe ' +
          'the Mayor should listen to the citizens and represent their voice while working closely with ' +
          'the council and founders. My goal is simple: help keep Cybertown Revival a community we are ' +
          'proud to be part of.'
        }
      ],

    };
  },
  async mounted() {
    await this.checkIfVoted();
    await this.checkIfEligibleToVote();
    await this.shuffleItems();
    // Set the first item in the new random order as the active tab
    if (this.items.length > 0) {
      this.activeId = this.items[0].id;
    }
    this.loaded = true;
  },
  methods: {
    async shuffleItems(): Promise<void> {
      let array = this.items;
      for (let i = array.length - 1; i > 0; i--) {
        // Pick a random index from 0 to i
        const j = Math.floor(Math.random() * (i + 1));
        // Swap elements array[i] and array[j]
        [array[i], array[j]] = [array[j], array[i]];
      }
    },
    async submitVote() {
      if (this.selectedVote !== null) {
        //submit to api using url /vote/castmayorvote with post request
        await this.$http.post('/vote/castmayorvote', {
          optionPicked: this.selectedVote,
          voteId: 1,
        })
        .then((response) => {
          appStore.methods.setBid(response.data.ballot_id);
          this.success = "Your vote has been cast successfully";
        })
        .catch((error) => {
          this.error = error.response.data.error;
        });
      }
    },
    async checkIfEligibleToVote() {
      await this.$http.get(`/vote/checkifeligible`)
      .then((response) => {
        if (response.data.eligible) {
          this.eligible = true;
        }
      })
      .catch((error) => {
        this.error = error.response.data.error;
      });
    },
    async checkIfVoted() {
      await this.$http.get(`/vote/checkifvoted/1`)
      .then((response) => {
        if (response.data.voted) {
          this.success = "You have already voted";
        }
      })
      .catch((error) => {
        console.log(error);
      });
    }
  },
});
</script>
<style scoped>
.election-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 600px;
  margin: 10px auto;
  font-family: Arial, sans-serif;
}

.election-header {
  color: #d0dbf7;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 20px;
  border-bottom: 1px solid #8f9bb6;
  padding-bottom: 10px;
}

.folder-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 0 0 20px 0;
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
  height: 250px;
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

.vote-section {
  padding: 15px;
  border: 1px solid #8f9bb6;
  background-color: #001829;
  box-shadow: -2px 3px black;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.vote-title {
  color: #8f9bb6;
  margin-top: 0;
  margin-bottom: 15px;
  text-transform: uppercase;
  font-size: 14px;
  letter-spacing: 1px;
}

.vote-controls {
  display: flex;
  gap: 10px;
  width: 100%;
  justify-content: center;
}

.vote-select {
  background-color: #001f35;
  color: #d0dbf7;
  border: 1px solid #8f9bb6;
  padding: 8px 12px;
  font-family: inherit;
  font-size: 14px;
  outline: none;
  flex: 1;
  max-width: 300px;
}

.vote-btn {
  background-color: #001f35;
  color: #d0dbf7;
  border: 1px solid #8f9bb6;
  padding: 8px 16px;
  cursor: pointer;
  text-transform: uppercase;
  font-weight: bold;
  letter-spacing: 1px;
  transition: all 0.2s;
}

.vote-btn:hover:not(:disabled) {
  background-color: #8f9bb6;
  color: #001829;
}

.vote-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>