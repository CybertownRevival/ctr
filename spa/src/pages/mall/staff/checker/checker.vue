<template>
  <div>
    <div id="objectModel" class="
    flex
    w-full
    bg-black
    justify-center
    items-center
    text-5xl
    z-10" style="height:calc(100vh - 112px)">
    </div>
    <div class="flex w-screen justify-center bg-blue-400 text-black h-8">
      <b>
        <h3 v-if="number === 1">{{ number }} Error Found</h3>
        <h3 v-else-if="number >= 0">{{ number }} Errors Found</h3>
        <h3 v-else>Loading...</h3>
      </b>
    </div>
    <div class="bg-blue-100 overflow-y-auto w-screen h-20 pl-5">
      <h3 class="text-black" v-if="number === 0 && loaded === 1">Loading object is complete<br />No errors were found</h3>
      <h3 class="text-black" v-else-if="number <= 0">Searching for errors...</h3>
      <ul v-else class="flex flex-col-reverse text-black">
        <li v-for="log in logs" :key="id"><h3>{{ log }}</h3></li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "MallChecker",
  data() {
    return {
      logs: [],
      number: -3,
      loaded: 0,
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
      const object = await this.$http.get(`/object/getObject/${ this.$route.params.object_id }`);
        let objectPath = `/assets/object/${object.data.object.directory}/${object.data.object.filename}`;
        const browser = X3D.getBrowser();
        const inline = browser.currentScene.createNode("Inline");
        inline.url = new X3D.MFString(objectPath);
        browser.currentScene.addRootNode(inline);
        this.loaded = 1;
    },
    overrideConsole() {
      const originalLog = console.log;
      console.log = (...args) => {
        ++this.number;
        if(this.number > 0){
          this.logs.push(args.join(' '));
        originalLog.apply(console, args)
        }
      }
    }
  },
  created() {
    this.overrideConsole();
  },
  mounted() {
    setTimeout(this.loadObjectPreview, 1000);
  }
})
</script>
