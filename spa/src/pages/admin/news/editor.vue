<template>
  <main class="w-full h-full p-4 overflow-y-auto">
    <h1 class="mb-4 text-2xl">
      Edit Cybertown News
    </h1>

    <div v-if="success" class="mb-3 text-chat">
      {{ success }}
    </div>

    <div v-if="error" class="mb-3 text-red-500">
      {{ error }}
    </div>

    <div v-if="loading">
      Loading News...
    </div>

    <div v-else>
      <p class="mb-2">
        Enter the approved HTML for the News page:
      </p>

      <textarea
        v-model="html"
        class="w-full h-96 p-3 text-black"
      />

      <div class="mt-4">
        <button
          type="button"
          class="btn-ui"
          @click="saveNews"
        >
          UPDATE NEWS
        </button>
      </div>

      <hr class="my-6">

      <h2 class="mb-3 text-xl">
        Preview
      </h2>

      <div
        class="content p-4 border-2 border-black"
        v-html="html"
      />
    </div>
  </main>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "NewsEditor",

  data() {
    return {
      html: "",
      loading: true,
      success: "",
      error: "",
    };
  },

  methods: {
    async getNews(): Promise<void> {
      try {
        const response = await this.$http.get("/news");

        this.html = response.data.news
          ? response.data.news.html
          : "";

        this.error = "";
      } catch (error) {
        console.log(error);

        this.error =
          "A problem occurred while loading the News page.";
      } finally {
        this.loading = false;
      }
    },

    async saveNews(): Promise<void> {
      try {
        await this.$http.post("/news", {
          html: this.html,
        });

        this.success = "News updated successfully.";
        this.error = "";
      } catch (error) {
        console.log(error);

        this.error =
          error.response?.data?.error ||
          "A problem occurred while updating the News page.";

        this.success = "";
      }
    },
  },

  async created() {
    await this.getNews();
  },
});
</script>