<template>
  <div class="flex-1 text-center" v-if="accessLevel">
    <div class="text-5xl p-5">Community Overview</div>
    <div class="flex-1 justify-self-center">
      <div class="m-5" v-if="accessLevel.includes('admin')">
        <div class="flex p-2 font-bold text-xl">Economy</div>
        <hr />
        <economic :accessLevel="accessLevel"></economic>
      </div>
      <div class="m-5" v-if="accessLevel.includes('mayor')">
        <div class="flex p-2 font-bold text-xl">Activity</div>
        <hr />
        <users :accessLevel="accessLevel"></users>
      </div>
      <div class="m-5" v-if="accessLevel.includes('admin')">
        <div class="flex p-2 font-bold text-xl">Objects</div>
        <hr />
        <objects :accessLevel="accessLevel"></objects>
      </div>
      <div class="m-5" v-if="accessLevel.includes('council')">
        <div class="flex p-2 font-bold text-xl">Places</div>
        <hr />
        <places :accessLevel="accessLevel"></places>
      </div>
    </div>
  </div>
  <div v-else>
    <div class="text-5xl p-5">Access Denied</div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import economic from './panels/economic.vue';
import users from './panels/users.vue';
import places from './panels/places.vue';
import objects from './panels/objects.vue';
export default Vue.extend({
  components: { economic, users, places, objects, },
  name: "overview",
  data: () => {
    return {
    };
  },
  props: [
    "accessLevel",
  ],
  methods: {
  },
  created() {
  },
  mounted() {
  },
});
</script>
