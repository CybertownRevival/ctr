<template>
  <div>
    <div v-if="places.length >= 1" class="mt-5 grid-cols-1 w-full justify-items-center text-center ">
      Total Count: {{ totalCount }}
    </div>
    <div class="text-2xl w-full justify-center text-center p-5">Users Clubs</div>
    <div v-if="places.length >= 1">
      <table>
        <tr>
          <th>ID</th>
          <th>Name</th>
        </tr>
        <tr style="vertical-align: top;" v-for="place in places"
          :key="place.id">
          <td class="p-4 text-xl font-bold border">{{ place.id }}</td>
          <td class="p-4 text-xl font-bold border">{{ place.name }}</td>
      </tr>
      </table>
    </div>
    <div v-else>No clubs found.</div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  name: "UserClubs",
  data: () => {
    return {
      totalCount: 0,
      places: [],
      limit: 10,
      offset: 0,
      showNext: true,
      error: null,
      pageNum: 1,
      pages: [],
      search: "",
    };
  },
  methods: {
    async searchPlaces(): Promise<any> {
      this.places = [];
      this.pages = [];
      this.totalCount = 0;
      try {
        await this.$http.get(`/admin/userplacessearch/`, {
          id: this.$route.params.id,
          type: 'club',
        }).then((res) => {
          this.places = res.data.results.places;
          this.totalCount = res.data.results.total[0].count;
        });
      } catch (error) {
        console.log(error);
      }
    },
    setLimit(){
      this.offset = 0;
      this.pageNum = 1;
      this.searchPlaces();
    },
  },
  async created() {
    await this.searchPlaces();
  },
  mounted() {
  },
});
</script>
