<template>
  <div class="flex" style="margin-bottom: 2rem;">
    <div class="w-full flex border">
      <div>
        <div class="flex justify-center" style="min-width:250px;min-height:250px;">
          <img v-if="thumbnailUrl"
               :src="thumbnailUrl"
               :alt="`Thumbnail for ${object.name}`"
               style="max-width:250px;max-height:250px;height:auto;width:auto;" />
          <div v-else
               class="flex items-center justify-center text-center text-sm"
               style="width:250px;height:250px;">
            No thumbnail stored
          </div>
        </div>
      </div>
      <div class="w-80">
        <div class="flex">
          <div class="w-24">Name:</div>
          <div>{{ object.name }} <span class="opacity-60">#{{ object.id }}</span></div>
        </div>
        <div class="flex"><div class="w-24">Price:</div><div>{{ object.price }}</div></div>
        <div class="flex">
          <div class="w-24">Sold:</div>
          <div>{{ object.instances }} of {{ object.quantity }}</div>
        </div>
        <div class="flex">
          <div class="w-24">Limit:</div>
          <div v-if="object.limit">{{ object.limit }}</div>
          <div v-else>Unlimited</div>
        </div>
        <div class="flex">
          <div class="w-24">Created By:</div><div>{{ object.username }}</div>
        </div>
        <div class="flex">
          <div class="w-24">Located In:</div>
          <div>{{ storeName }}</div>
        </div>
        <div class="flex">
          <div class="w-24">Uploaded:</div><div>{{ uploadedOn }}</div>
        </div>
        <div class="flex">
          <div class="w-24">State:</div><div>{{ statusLabel }}</div>
        </div>
      </div>
      <div>
        <div class="w-40">
          <slot name="actions"></slot>
          <router-link v-if="checkFrom" class="btn-ui" :to="checkRoute">Check Item</router-link>
        </div>
      </div>
      <div>
        <slot name="primary"></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";

/**
 * One object as it appears in any Mall staff list.
 *
 * The five staff lists previously each rendered their own copy of this markup
 * and each showed a different subset of the same fields, so reconstructing an
 * object's basic state meant visiting several pages. Every row now carries the
 * same identity, commerce and lifecycle facts; the per-page differences stay in
 * the action slots.
 */

/** Mirrors ObjectService's STATUS_* constants and the panel's own wording. */
const STATUS_LABELS: { [status: number]: string } = {
  0: "Removed",
  1: "Stocked",
  2: "Pending",
  3: "Warehouse",
  4: "Destocked",
};

export default Vue.extend({
  name: "MallObjectRow",
  props: {
    object: {
      type: Object,
      required: true,
    },
    /**
     * Which list this row belongs to, so the checker can offer a queue and a way
     * back. Omitted for lists with no queue.
     */
    checkFrom: {
      type: String,
      default: "",
    },
    /** The list's current page, limit and sort, preserved across the round trip. */
    checkQuery: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    /**
     * Null when either half of the path is absent.
     *
     * Interpolating regardless produces `/assets/object/undefined/undefined`,
     * which is a real request that 404s and leaves a broken-image icon in the
     * row -- indistinguishable, at a glance, from an object whose thumbnail
     * failed to upload.
     */
    thumbnailUrl(): string | null {
      const { directory, image } = this.object;
      if (!directory || !image) {
        return null;
      }
      return `/assets/object/${directory}/${image}`;
    },
    storeName(): string {
      return this.object.store ? this.object.store.name : "-";
    },
    statusLabel(): string {
      return STATUS_LABELS[this.object.status] || "Unknown";
    },
    uploadedOn(): string {
      if (!this.object.created_at) {
        return "unknown";
      }
      return new Date(this.object.created_at).toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      });
    },
    checkRoute(): any {
      return {
        name: "mall-checker",
        params: { object_id: String(this.object.id) },
        query: { from: this.checkFrom, ...this.checkQuery },
      };
    },
  },
});
</script>
