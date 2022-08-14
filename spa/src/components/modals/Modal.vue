<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
    <div class="absolute
        top-10
        bottom-10
        left-1/2
        transform
        -translate-x-1/2
        border-2
        border-gray-300
        max-w-full
        shadow-lg
        bg-black
        overflow-y-hidden" style="width:1024px;">
      <div class="flex
      flex-row-reverse
      bg-gradient-to-r
      from-indigo-500
      to-blue-500
      p-1
      border-b-2
      border-gray-400">
        <slot name="header"></slot>
        
      </div>

      <div class="flex-1 p-5 overflow-y-auto max-h-full">
        <slot name="body">Not Found</slot>
      </div>
    </div>

  </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
  name: "Modal",
  components: {},
  data: () => {
    return {};
  },
  methods: {
    closeModal() : void {
      this.$emit("close");
    },
  },
  mounted() {},
});
</script>
