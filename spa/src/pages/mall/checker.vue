<template>
  <div id="objectModel" class="
  flex
  w-full
  h-screen
  bg-black
  justify-center
  items-center
  text-5xl
  z-10">
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "MallChecker",
  data() {
    return {
      
    }
  },
  methods: {
    loadObjectPreview() {
      const browser = X3D.createBrowser();
      document.querySelector("#objectModel").appendChild(browser);
      const objectURL = '/assets/object/ObjectPreview.wrl';
      const objectViewer = X3D.getBrowser();
      objectViewer.loadURL(new X3D.MFString(objectURL));
      setTimeout(this.loadReference, 3000);
      setTimeout(this.loadObject, 3000);
    },
    loadReference(){
      const reference = '/assets/object/MallReference.wrl';
      const browser = X3D.getBrowser();
      const inline = browser.currentScene.createNode("Inline");
      inline.url = new X3D.MFString(reference);
      browser.currentScene.addRootNode(inline);
    },
    async loadObject(){
      await this.$http.get(`/object/getObject/${ this.$route.params.object_id }`)
        .then((response) =>{
          let objectPath = `/assets/object/${response.data.object.directory}/${response.data.object.filename}`;
          const browser = X3D.getBrowser();
          const inline = browser.currentScene.createNode("Inline");
          inline.url = new X3D.MFString(objectPath);
          browser.currentScene.addRootNode(inline);
        })
    },
  },
  mounted() {
    setTimeout(this.loadObjectPreview, 1000);
  }
})
</script>
