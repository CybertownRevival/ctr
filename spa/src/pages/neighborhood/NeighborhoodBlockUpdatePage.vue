
<template>
  <div class="p-4 text-center">
    <div v-if="loading">
      Loading block...
    </div>

    <div v-else-if="!canAdmin">
      <div class="text-2xl font-bold text-green">
        Access Denied
      </div>
      <p class="mt-4">
        You do not have permission to manage this block.
      </p>
    </div>

    <div v-else-if="!block">
      <div class="text-2xl font-bold text-green">
        Block Not Found
      </div>
    </div>

    <div v-else>
      <div class="text-2xl font-bold text-green">
        {{ block.name }}
      </div>

      <!-- Block status -->
      <div class="mt-6">
        <p>
          Current status:
          <span
            :class="block.status === 1 ? 'text-green' : 'text-red-500'"
          >
            {{ block.status === 1 ? "OPEN" : "CLOSED" }}
          </span>
        </p>

        <div class="mt-4">
          <button
            type="button"
            class="btn-ui"
            :disabled="saving || renaming"
            @click="changeBlockStatus"
          >
            {{
              saving
                ? "Updating..."
                : block.status === 1
                  ? "Close Block"
                  : "Reopen Block"
            }}
          </button>
        </div>
      </div>

      <!-- Rename: Admin, CR and Colony Leader only -->
      <div v-if="canRename" class="mt-8">
        <div class="text-xl font-bold text-green">
          Rename Block
        </div>

        <p class="mt-3">
          Enter a new name for this block.
        </p>

        <div class="mt-4">
          <input
            v-model="newBlockName"
            type="text"
            maxlength="100"
            class="p-2 text-black"
            :disabled="saving || renaming"
            @keyup.enter="renameBlock"
          />
        </div>

        <div class="mt-4">
          <button
            type="button"
            class="btn-ui"
            :disabled="
              saving ||
              renaming ||
              !newBlockName.trim() ||
              newBlockName.trim() === block.name
            "
            @click="renameBlock"
          >
            {{ renaming ? "Saving..." : "Save Name" }}
          </button>
        </div>
      </div>

      <!-- Feedback -->
      <p
        v-if="message"
        class="mt-4"
        :class="messageError ? 'text-red-500' : 'text-green'"
      >
        {{ message }}
      </p>

      <!-- Navigation -->
      <div class="mt-6">
        <router-link
          :to="{
            name: 'neighborhoodUpdate',
            params: { id: $route.params.id }
          }"
          class="btn-ui inline-block"
        >
          Back
        </router-link>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

interface Block {
  id: number;
  name: string;
  status: number;
  location: number;
}

export default Vue.extend({
  name: "NeighborhoodBlockUpdatePage",

  data: () => ({
    loading: true,
    canAdmin: false,
    canRename: false,
    saving: false,
    renaming: false,
    block: null as Block | null,
    newBlockName: "",
    message: "",
    messageError: false,
  }),

  methods: {
    async loadBlock() {
      this.loading = true;
      this.canAdmin = false;
      this.canRename = false;
      this.block = null;
      this.newBlockName = "";
      this.message = "";
      this.messageError = false;

      try {
        const hoodId = this.$route.params.id;
        const blockId = Number(this.$route.params.blockId);

        const hoodResponse = await this.$http.get(`/hood/${hoodId}`);

        const place = hoodResponse.data.hood;
        place.hood = hoodResponse.data.hood;
        place.colony = hoodResponse.data.colony;

        this.$store.methods.setPlace(place);

        const permissionResponse = await this.$http.get(
          `/hood/${hoodId}/can_admin`,
        );

        this.canAdmin = permissionResponse.data.result === true;

        if (!this.canAdmin) return;

        const renamePermissionResponse = await this.$http.get(
          `/hood/${hoodId}/can_rename_block`,
        );

        this.canRename = renamePermissionResponse.data.result === true;

        const blocksResponse = await this.$http.get(
          `/hood/${hoodId}/blocks`,
        );

        this.block =
          blocksResponse.data.blocks.find(
            (block: Block) => block.id === blockId,
          ) || null;

        if (this.block) {
          this.newBlockName = this.block.name;
        }
      } catch (error) {
        console.error("Failed to load block management page", error);
        this.message = "Unable to load block information.";
        this.messageError = true;
      } finally {
        this.loading = false;
      }
    },

    async changeBlockStatus() {
      if (!this.block || !this.canAdmin || this.saving || this.renaming) {
        return;
      }

      const block = this.block;
      const newStatus = block.status === 1 ? 0 : 1;
      const action = newStatus === 0 ? "close" : "reopen";

      const confirmed = window.confirm(
        `Are you sure you want to ${action} ${block.name}?`,
      );

      if (!confirmed) return;

      this.saving = true;
      this.message = "";
      this.messageError = false;

      try {
        const hoodId = this.$route.params.id;

        await this.$http.post(
          `/hood/${hoodId}/block/${block.id}/status`,
          { status: newStatus },
        );

        block.status = newStatus;

        this.message = newStatus === 0
          ? "Block closed successfully."
          : "Block reopened successfully.";
      } catch (error) {
        console.error("Failed to update block status", error);
        this.message = "Unable to update block status. Please try again.";
        this.messageError = true;
      } finally {
        this.saving = false;
      }
    },

    async renameBlock() {
      if (!this.block || !this.canAdmin || !this.canRename) return;
      if (this.saving || this.renaming) return;

      const name = this.newBlockName.trim();

      if (!name || name.length > 100) {
        this.message = "Block name must be between 1 and 100 characters.";
        this.messageError = true;
        return;
      }

      if (name === this.block.name) return;

      const block = this.block;

      this.renaming = true;
      this.message = "";
      this.messageError = false;

      try {
        const hoodId = this.$route.params.id;

        await this.$http.post(
          `/hood/${hoodId}/block/${block.id}/rename`,
          { name },
        );

        block.name = name;
        this.newBlockName = name;

        this.message = "Block renamed successfully.";
      } catch (error) {
        console.error("Failed to rename block", error);
        this.message = "Unable to rename block. Please try again.";
        this.messageError = true;
      } finally {
        this.renaming = false;
      }
    },
  },

  mounted() {
    this.loadBlock();
  },

  watch: {
    "$route.params.blockId"() {
      this.loadBlock();
    },
    "$route.params.id"() {
      this.loadBlock();
    },
  },
});
</script>
