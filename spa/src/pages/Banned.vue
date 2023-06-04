<template>
  <div >
    <div class="grid grid-cols-5 grid-rows-5">
    <div class="col-span-3 col-start-2 row-start-2 bg-red-800 text-center align-middle">
      <div class="text-4xl text-center m-3.5">Account Suspended</div>
    </div>
    <div class="
      col-span-3
      col-start-2
      row-start-3
      row-span-3
      text-xl
      border-r-4
      border-b-4
      border-l-4
      border-red-800
    ">
      <div class="m-2">
        Dear User,
        <br><br>
        Thank you for your interest in the Revival of Cybertown.
        Unfortunately, our security has determined that you could not
        follow the norms of the community.  These norms are set and agreed
        upon by the members to make sure everyone has a safe and enjoyable
        time while visiting Cybertown Revival.
        <br><br>
        Have a great day!
      </div>
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
