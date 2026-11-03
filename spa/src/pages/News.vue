<template>
  <main class="w-full min-h-full overflow-y-auto bg-black text-gray-300 font-sans">
    <div class="my-2 text-center">
      <img
        src="/assets/img/anchor.jpg"
        alt="Cybertown Virtual News"
        class="max-w-full h-auto mx-auto"
      >
    </div>

    <div
      v-if="loading"
      class="p-5 text-center text-gray-300"
    >
      Loading News...
    </div>

    <div
      v-else-if="error"
      class="p-5 text-center text-red-400"
    >
      {{ error }}
    </div>

    <div
      v-else-if="!news"
      class="p-5 text-center text-gray-300"
    >
      No News has been published yet.
    </div>

    <div
      v-else
      class="w-5/6 mx-auto"
    >
      <div
        class="w-full"
        v-html="news.html"
      />

      <div
        class="mt-6 py-2 border-t border-green-500 text-xs text-center text-gray-400"
      >
        Last updated:
        {{ formatDate(news.updated_at) }}

        <span v-if="news.updated_by_username">
          &nbsp;|&nbsp;
          Updated by:
          {{ news.updated_by_username }}
        </span>
      </div>
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
