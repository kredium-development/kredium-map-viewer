<script setup>

import ClickOutside from "@/components/ClickOutside.vue";

const { isOpen, transparentOverlay } = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },

  transparentOverlay: {
    type: Boolean,
    required: false,
  },
});

const emit = defineEmits(["modal-close"]);

const close = () => {
  emit('modal-close')
}

</script>

<template>
  <div v-if="isOpen" class="tw-fixed tw-z-50 tw-top-0 tw-left-0 tw-w-full tw-h-full tw-bg-dark tw-bg-opacity-40" :class="[
    transparentOverlay ? 'tw-bg-opacity-0' : 'tw-bg-opacity-40',
  ]">
    <ClickOutside @close="close">
      <slot></slot>
    </ClickOutside>
  </div>
</template>
