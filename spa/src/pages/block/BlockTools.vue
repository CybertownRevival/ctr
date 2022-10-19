<template>
  <div class="text-center">
    <a href="" class="btn-ui">Information</a>
    <a href="" class="btn-ui">Messages</a>
    <a href=""><img src="/assets/img/up.gif" /> hood name </a>
    <br/>
    <br/>
    <a href="" class="btn-ui">Message to All</a>
    <a href="" class="btn-ui">Inbox</a>
    <a href="" class="btn-ui">Update</a>
    <a href="" class="btn-ui" title="Check Images">Check</a>
    <a href="" class="btn-ui">Access Rights</a>
    <br/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: "BlockTools",
  data: () => {
    return {
      loaded: false,
    };
  },
  mounted() {
    console.log('block tools');
    console.log(this.$store.data.user);
    if(this.$store.data.user.admin) {
      console.log("is admin");
    } else {
      console.log('is not admin');

    }

  },
});
</script>

