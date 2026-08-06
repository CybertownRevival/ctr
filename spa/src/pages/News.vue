<template>
  <main class="w-full h-full p-6 overflow-y-auto">
    <h1 class="mb-6 text-4xl">
      Cybertown News
    </h1>

    <div v-if="loading">
      Loading News...
    </div>

    <div v-else-if="error" class="text-red-500">
      {{ error }}
    </div>

    <div v-else-if="!news">
      No News has been published yet.
    </div>

    <div v-else>
      <div
        class="content"
        v-html="news.html"
      />

      <hr class="my-6">

      <p class="text-sm">
       Last updated:
      {{ formatDate(news.updated_at) }}
</p>

<p
  v-if="news.updated_by_username"
  class="text-sm"
>
  Updated by:
  {{ news.updated_by_username }}
</p>
    </div>
  </main>
</template>

<script lang="ts">
import Vue from "vue";

interface NewsRecord {
  id: number;
  html: string;
  updated_by_member_id: number | null;
  updated_by_username: string | null;
  created_at: string;
  updated_at: string;
}

export default Vue.extend({
  name: "News",

  data() {
    return {
      news: null as NewsRecord | null,
      loading: true,
      error: "",
    };
  },

  methods: {
    async getNews(): Promise<void> {
      try {
        const response = await this.$http.get("/news");

        this.news = response.data.news;
        this.error = "";
      } catch (error) {
        console.log(error);

        this.error =
          "A problem occurred while loading the News page.";
      } finally {
        this.loading = false;
      }
    },

    formatDate(date: string): string {
      if (!date) {
        return "Unknown";
      }

      return new Date(date).toLocaleString();
    },
  },

  async created() {
    await this.getNews();
  },
});
</script>