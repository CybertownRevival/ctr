<template>
  <div class="ctr-modal-backdrop" @click.self="close">
    <div class="ctr-modal" role="dialog" aria-modal="true" :aria-label="title">
      <div class="ctr-modal-head">
        <span class="truncate">{{ title }}</span>
        <span class="ctr-modal-head-actions">
          <slot name="actions"></slot>
          <button class="btn-ui-inline" @click="close">Close</button>
        </span>
      </div>
      <!--
        The only scrolling container. Everything a checker opens here -- raw
        VRML with 400-character lines, a full-size thumbnail -- is content the
        page cannot bound, so it is bounded once, here, and never allowed to
        widen the document behind it.
      -->
      <div class="ctr-modal-body"><slot></slot></div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "CheckerModal",
  props: {
    title: {
      type: String,
      default: "",
    },
  },
  mounted(): void {
    document.addEventListener("keydown", this.onKeydown);
  },
  destroyed(): void {
    document.removeEventListener("keydown", this.onKeydown);
  },
  methods: {
    onKeydown(event: KeyboardEvent): void {
      // `key` rather than `keyCode`, and only Escape: the checker's own inputs
      // must keep every other key, and nothing here may become a global
      // shortcut that fights typing in the rejection reason.
      if (event.key === "Escape" || event.key === "Esc") {
        this.close();
      }
    },
    close(): void {
      this.$emit("close");
    },
  },
});
</script>

<style scoped>
.ctr-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.ctr-modal {
  display: flex;
  flex-direction: column;
  background: #001829;
  border: 2px solid #ffffff;
  /* Bounded in both axes so no content can push the dialog -- or the document
     behind it -- wider or taller than the viewport. */
  width: 100%;
  max-width: 64rem;
  max-height: 90vh;
  min-width: 0;
}

.ctr-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid #ffffff;
  min-width: 0;
}

.ctr-modal-head-actions {
  display: flex;
  align-items: center;
  flex: none;
}

.ctr-modal-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 0.5rem;
}
</style>
