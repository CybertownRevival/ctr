<template>
  <div class="flex-1 text-center">
    <div class="citymap">
      <router-link to="/place/funpark" style="top: 10px; left: 130px;">FUN
        PARK</router-link>
      <router-link to="/place/cityhall">CITY HALL</router-link>
      <router-link to="/place/pool" style="top: 30px;left: 170px;">CITY
        POOL</router-link>
      <span style="top: 30px;left: 260px;">LIBRARY</span>
      <router-link to="/place/theatre" style="top: 55px;left: 190px;">
        THEATER</router-link>
      <span style="top: 55px;left: 20px;">THE CYBERHOOD</span>
      <span style="top: 80px;left: 230px;">EPLEX</span>
      <span style="top: 80px;left: 110px;">EMPLOYMENT<br/>OFFICE</span>
      <span style="top: 90px;right: 60px;">THE MALL</span>
      <span style="top: 95px;left: 20px;text-align:left">THE<br/>CAMPUS</span>
      <router-link to="/place/enter" style="top: 110px;right: 180px;">THE
        PLAZA</router-link>
      <router-link to="/place/postoffice" style="top: 130px;left: 70px;">POST
        <br/>
        OFFICE</router-link>
      <span style="top: 150px;left: 130px;">OLD
        TOWN</span>
      <router-link to="/place/stadium"
                   style="top: 150px;right: 60px;">CITY
        STADIUM</router-link>
      <span style="top: 180px;right: 200px;">NEWS<br/>
        CENTER</span>
      <span style="top: 220px;left:
      130px;">THE SUBURBS</span>
      <span style="top: 220px;right: 100px;">BUSINESS<br/>DISTRICT</span>
      <span style="top: 260px;left: 240px;">STARPORT</span>
      <span style="text-align:left; bottom: 20px;left: 20px;">BEYOND<br/>CYBERTOWN</span>
      <span style="bottom: 0;right: 100px;">LE
        CAFE</span>
    </div>
    <br/>
    <p style="color:#00CCFF"><b>THE CYBERTOWN MAP</b></p>
    <p><img src="/assets/img/townmap_legend.gif"></p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: "CitymapPage",
  data: () => {
    return {};
  },
});
</script>
