<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal" @dragover="handleOver">
    <div draggable class="
      absolute
      border-2
      border-gray-300
      shadow-lg
      bg-black
      overflow-y-hidden
      transform
      -translate-x-1/2
      " 
      @dragstart="handleStart"
      @dragend="handleDrag"
      :style="{
        top: `${current_top}px`,
        left: `${current_left}px`,
      }">
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
  data() {
    return{
      current_top: 10,
      current_left: Math.floor(window.innerWidth / 2),
      previous_top: Math.floor(window.innerHeight / 2),
      previous_left: Math.floor(window.innerWidth / 2),
    };
  },
  methods: {
    handleOver(e) {
      e.preventDefault();
      return true;
    },
    handleStart(e) {
      this.previous_top = e.y;
      this.previous_left = e.x;

      e.target.style.opacity = 0.3;
    },
    handleDrag(e) {
      if (e.x === 0 && e.y === 0) return;

      this.current_top -= this.previous_top - e.y;
      this.current_left -= this.previous_left - e.x;

      if(this.current_top < 0){
        this.current_top = 0;
      }
      if(this.current_left < 0){
        this.current_left = 0;
      }

      this.previous_top = e.y;
      this.previous_left = e.x;

      e.target.style.opacity = 1;
    },
    closeModal() : void {
      this.$emit("close");
    },
  },
  mounted() {},
});
</script>
