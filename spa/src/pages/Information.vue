<template>
  <div class="h-full w-full bg-black flex flex-col" style="padding: 10px">
    <div>
      Leader<br/>
      <span style="color: #00df00; text-decoration: underline; cursor: pointer;"
        v-on:click="opener('#/home/'+owner)">{{ this.owner }}</span>
    </div>
    <div style="padding-top: 10px">
      <p>Deputies</p>
      <ul>
        <li v-for="deputy in deputies">
          <span style="color: #00df00; text-decoration: underline; cursor: pointer"
            v-on:click="opener('#/home/'+deputy.username)">
          {{ deputy.username }}
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "InformationPage",
  data: () => {
    return {
      owner: null,
      deputies: [],
    };
  },
  methods: {
    async getData(): Promise<void> {
      let infopoint = null;
      switch (this.$route.params.type) {
      case "block":
        infopoint = `/block/${
          this.$route.params.id
        }/getAccessInfo/`;
        break;
      case "hood":
        infopoint = `/hood/${
          this.$route.params.id
        }/getAccessInfo/`;
        break;
      case "colony":
        infopoint = `/colony/${
          this.$route.params.id
        }/getAccessInfo/`;
        break;
      case "public": {
        console.log(this.$store.data.place.slug);
        infopoint = `/place/getAccessInfo/${this.$route.params.slug}/${this.$route.params.id}`;
        break;
      }
      case "shop": {
        infopoint = "/place/getAccessInfo/mall";
        break;
      }
      default:
        break;
      }
      return this.$http.get(infopoint).then((response) => {
        this.owner = response.data.data.owner[0].username;
        response.data.data.deputies.forEach((username, index) => {
          this.deputies[index] = username;
        });
      });
    },
    async opener(link): Promise<void> {
      window.opener.location.href = link;
      window.close();
    },
  },
  mounted() {
    this.getData();
  },
});
</script>
