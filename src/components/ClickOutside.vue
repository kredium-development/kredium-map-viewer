<script setup>
import { onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['close'])

// Handle Escape key press
const handleEscape = (event) => {
  if (event.key === 'Escape') {
    closeGallery()
  }
}

const closeGallery = () => {
  emit('close')
}

// Register global listeners
onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

// Cleanup listeners
onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <div class="tw-h-full" @click.self="closeGallery">
    <slot />
  </div>
</template>
