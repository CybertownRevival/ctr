<template>
  <Modal>
    <template v-slot:header>
        <button type="button" class="btn-ui-inline" @click="close('Modal closed')">X</button>
    </template>
    <template v-slot:body>
        TEST MODAL
    </template>
  </Modal>
</template>

<script lang="ts">
import Vue from "vue";

import Modal from './Modal.vue';
import ModalMixin from './mixins/ModalMixin';

export default Vue.extend({
  name: "TestModal",
  components: {Modal},
  mixins: [ModalMixin],
});
</script>