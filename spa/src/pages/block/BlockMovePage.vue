<template>
  <div class="h-full w-full bg-black flex flex-col" v-if="loaded">

    <div>
      <!-- RELOCATE MESSAGE -->
      <p><strong>Hello <$NNM>,</strong> do you want to move from
      '<$comm1> / <$neigh1> / <$block1> / <$prop1>' to
      this <$PNM>?
      <!-- in <$BNM> <b>'<$comm2> / <$neigh2> / <$block2>'</b>?-->
      </p>
      <button type="button" class="btn">Yes</button>
      <button type="button" class="btn">No</button>
    </div>
    <div>
      <!-- SETTLE MESSAGE -->
      <p class="text-center font-weight-bold">Settle down here!</p>

      <button type="button" class="btn">Yes</button>
      <button type="button" class="btn">No</button>

      <table>
        <tr>
          <td style="width:150px"><strong>House Name</strong></td>
          <td><input maxlength="32" size="20" /></td>
        </tr>

        <tr>
          <td><strong>House Description</strong></td>
          <td><input maxlength="255" size="32" /></td>
        </tr>

        <tr>
          <td><strong>Your First Name</strong></td>
          <td><input maxlength="20" size="20" /></td>
        </tr>

        <tr>
          <td><strong>Your Last Name</strong></td>
          <td><input maxlength="32" size="32" /></td>
        </tr>

        <tr><td colspan="2">&nbsp;</td></tr>

        <tr>
          <td><strong>House icons</strong></td>
          <td>
            <input type="radio" />None<br />

            <template>
              <input type="radio">
              <img src="<$g_HTMLRoot>/home/<$community>/property/<$2TI><$2DI>.gif" />
              <br />
            </template>
          </td>
        </tr>

        <tr><td colspan="2">&nbsp;</td></tr>

        <tr>
          <td><strong>3D Houses</strong></td>
          <td>
            <input type="radio" />None <br />

            <template>
              <input type="radio" />
              <img src="<$g_HTMLRoot>/home/<$community>/property/<$3TI><$3DI>.gif" />
              Price:
              <br />
            </template>
          </td>
        </tr>
      </table>
    </div>
    <div>
      <!-- DONE MESSAGE -->
      <p class="text-center">Congratulations, <strong><$NNM></strong>!<br />
        You have settled down and are now a <strong>Resident</strong>!</p>

      <p><a href="block<$g_exe>?ac=place&ID=<$ID>" target="place">Click here</a>
        to update the block and enter your new home ...</p>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { colonyDataHelper, homeDataHelper } from '@/helpers';

export default Vue.extend({
  name: "BlockMovePage",
  data: () => {
    return {
      loaded: false,
      block: undefined,
      hood: undefined,
      colony: undefined,
      locations: [],
    };
  },
  methods: {
    getData(): Promise<void> {
      return Promise.all([
        this.$http.get("/block/" + this.$route.params.id),
        this.$http.get("/block/" + this.$route.params.id + "/locations"),
      ]).then((response) => {
        this.block = response[0].data.block;
        this.hood = response[0].data.hood;
        this.colony = response[0].data.colony;

        // todo check this location is still available

        // todo check if they already have a home. if not, tell them to buy
        // todo else, ask them if they want to move?

        this.locations = response[1].data.locations;
        this.$store.methods.setPlace(response[0].data);

        document.title = "Move - Cybertown";
        this.loaded = true;
      });
    },
    settle() {
      // todo check they have selected all the required data
      // todo check they have enough funds
      // todo check the spot is still available
      // todo do it
      // todo show a congrats
    },
    relocate() {
      // todo check they already have a spot
      // todo check this spot is still available
      // todo do it
    },
  },
  mounted() {
    this.getData();

  },
});
</script>
