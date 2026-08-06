<template>
  <main class="news-page">
   <div style="text-align:center; margin:10px 0;">
    <img src="/assets/img/anchor.jpg" alt="Cybertown Virtual News" style="max-width:100%; height:auto;">
  </div>

    <div v-if="loading" class="news-status">
      Loading News...
    </div>

    <div v-else-if="error" class="news-status news-error">
      {{ error }}
    </div>

    <div v-else-if="!news" class="news-status">
      No News has been published yet.
    </div>

    <div v-else class="news-wrapper">
      <div
        class="news-content"
        v-html="news.html"
      />

      <div class="news-metadata">
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

<style scoped>
.news-page {
  width: 100%;
  min-height: 100%;
  overflow-y: auto;
  background-color: #000000;
  color: #cccccc;
  font-family: Arial, Helvetica, sans-serif;
}

.news-wrapper {
  width: 85%;
  margin: 0 auto;
}

.news-content {
  width: 100%;
}

.news-status {
  padding: 20px;
  text-align: center;
  color: #cccccc;
}

.news-error {
  color: #ff6666;
}

.news-metadata {
  margin-top: 24px;
  padding: 8px 0;
  border-top: 1px solid #00ff00;
  color: #999999;
  font-size: 11px;
  text-align: center;
}
</style>