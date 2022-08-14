<script lang="ts"   >
import Vue from 'vue';

export default new Vue({
  methods: {
    open(component, props = {}) {
      return new Promise((resolve, reject) => {
        console.log("ModalService open");
        this.$emit('open', { component, props, resolve, reject });
      });
    }
  }
})

</script>