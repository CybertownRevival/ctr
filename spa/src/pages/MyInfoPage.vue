<template>
  <div class="flex-1">
    <h3 align="center">My Home - My Information</h3>
    <p align="center">
      Here you can change your personal information, e.g. email address, first
      name, last name, short info for the citizen directory. And you could visit
      your private house.<br />
    </p>

    <div align="center">
      <table border="0">
        <tr>
          <td width="200" align="center">
            <img src="/assets/img/icon_myinfo.jpg" border="0" /><br /><b
              >Personal Info</b
            >
          </td>
          <td width="200" align="center">
            <img src="/assets/img/icon_myhouse.jpg" border="0" /><br /><b
              >Visit My House</b
            >
          </td>
          <td width="200" align="center">
            <router-link to="/myinfo/avatar"
              ><img src="/assets/img/icon_myinfo.jpg" border="0" /><br /><b
                >My Avatar</b
              ></router-link
            >
          </td>
        </tr>
        <tr>
          <td width="200" align="center">
            <router-link to="/myinfo/account"
              ><img src="/assets/img/icon_myinfo.jpg" border="0" /><br /><b
                >My Account</b
              ></router-link
            >
          </td>
          <td width="200" align="center">
            <img src="/assets/img/icon_myinfo.jpg" border="0" /><br /><b
              >Storage Units</b
            >
          </td>
          <td width="200" align="center">
            <img src="/assets/img/icon_myinfo.jpg" border="0" /><br /><b
              >Avatar Library</b
            >
          </td>
        </tr>
      </table>
      <br />
      To access and set up your Instant Message Center, click on the Online
      Citizens link under City Time in the right frame.
      <br /><br /><br />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: "MyInfopage",
  data: () => {
    return {};
  },
  methods: {},
  mounted() {},
});
</script>
