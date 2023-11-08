<template>
<div>
  City Time {{ this.time }}
</div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "ClockPage",
  data() {
    return {
      interval: null,
      time: "00:00 --",
      loaded: false,
    };
  },
  beforeDestroy() {
    // prevent memory leak
    clearInterval(this.interval);
  },
  created() {
    // update the time every second
    this.interval = setInterval(() => {
      this.time = Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        timeZone: "America/New_York",
      }).format();
    }, 1000);
  },
});
</script>
