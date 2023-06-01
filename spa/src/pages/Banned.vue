<template>
  <div >
    <div class="grid grid-cols-5 grid-rows-5 gap-4">
    <div class="col-span-3 col-start-2 row-start-2 bg-red-800 text-center">
      <span class="text-4xl text-center">Account Banned</span>
    </div>
    <div class="col-span-3 col-start-2 row-start-3 row-span-3 text-xl">
      Dear User,
      <br><br>
      Thank you for you interest in the Revival of Cybertown.
      Unfortunately our security has determined that you could not
      follow the norms of the community.  These norms are set and agreed
      upon by the members to make sure everyone has a safe and enjoyable
      time while visiting Cybertown Revival.
      <br><br>
      Have a great day!
    </div>
  </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "BannedNotice",
});

</script>
