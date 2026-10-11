<template>
  <div class="p-5">
    <h2 class="text-center">Designer Homes</h2>

    <h3 class="font-bold mt-5">Buying a home</h3>
    <ol class="list-decimal ml-8">
      <li>Pick a store from the Designer Homes Store Directory.</li>
      <li>Find a home you like and click <b>Buy</b>. The price is taken from your wallet and paid
        to the home's creator.</li>
      <li>Once bought, the home is yours to keep. You can switch to it at any time for free.</li>
    </ol>

    <h3 class="font-bold mt-5">Using a home</h3>
    <ol class="list-decimal ml-8">
      <li>Open <router-link :to="{ name: 'home-update-home' }">Update Home</router-link>
        (or settle on a block if you don't have a home yet).</li>
      <li>Under <b>Your Designer Homes</b>, choose the home you bought and click Update.</li>
      <li>If you were living in one of the standard 3D homes, its price is refunded as usual.</li>
    </ol>

    <h3 class="font-bold mt-5">Uploading a home</h3>
    <ul class="list-disc ml-8">
      <li>Use the <b>Upload</b> button in Designer Homes when uploading is open.</li>
      <li>You need a .wrl world file (max 1mb), a .jpg thumbnail (max 80kb) and up to 5 texture
        files. Textures are saved with their original file names, so reference them from your .wrl
        by file name only (e.g. <code>url "wall.jpg"</code>).</li>
      <li>Uploads are checked by the Designer Homes staff before they go on sale. Staff may move
        your home to a different store.</li>
      <li>Every time someone buys your home, you receive its full price.</li>
    </ul>

    <div class="text-center mt-5">
      <router-link to="/place/deshomes">
        <button class="btn">Back to Designer Homes</button>
      </router-link>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "DesignerHomesHelpPage",
});
</script>
