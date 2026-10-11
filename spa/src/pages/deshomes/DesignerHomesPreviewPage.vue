<template>
  <div class="flex flex-col w-full h-screen bg-black">
    <div class="flex-none p-2 text-center">
      <strong>{{ name }}</strong>
      <span v-if="!error"> - Designer Homes Preview</span>
      <div class="text-red-500" v-if="error">{{ error }}</div>
    </div>
    <div id="homePreview" class="flex-1 w-full"></div>
  </div>
</template>

<script lang="ts">
/* global X3D */
import Vue from "vue";

export default Vue.extend({
  name: "DesignerHomesPreviewPage",
  data: () => {
    return {
      name: "",
      error: "",
    };
  },
  methods: {
    async loadPreview(): Promise<void> {
      try {
        const response = await this.$http.get(`/designer_home/preview/${this.$route.params.id}`);
        const { homeDesign } = response.data;
        this.name = homeDesign.name;
        document.title = `${homeDesign.name} - Designer Homes Preview`;

        const browser = X3D.createBrowser();
        browser.style.width = "100%";
        browser.style.height = "100%";
        document.querySelector("#homePreview").appendChild(browser);
        X3D.getBrowser(browser).loadURL(new X3D.MFString(
          `/assets/worlds/${homeDesign.assets_dir}${homeDesign.world_filename}`,
        ));
      } catch (errorResponse: any) {
        this.error = errorResponse.response?.data?.error ?? "An unknown error occurred";
      }
    },
  },
  mounted() {
    this.loadPreview();
  },
});
</script>
