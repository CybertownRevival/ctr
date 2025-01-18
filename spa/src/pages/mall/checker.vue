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
      directory: "",
      file: "",
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
      let objectPath = `/assets/object/${this.directory}/${this.file}`;
      const browser = X3D.getBrowser();
      const inline = browser.currentScene.createNode("Inline");
      inline.url = new X3D.MFString(objectPath);
      browser.currentScene.addRootNode(inline);
    },
    async getObjectDetails(){
      const object = await this.$http.get(`/object/get_object/${ this.$route.params.object_id }`);
      this.directory = object.data.object.directory;
      this.file = object.data.object.filename;
    },
  },
  created(){
    this.getObjectDetails();
  },
  mounted() {
    setTimeout(this.loadObjectPreview, 1000);
  }
})
</script>
