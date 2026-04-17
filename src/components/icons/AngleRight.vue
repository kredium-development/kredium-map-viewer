<script setup>
const { color } = defineProps({
  color: {
    type: String,
    default: '#241C15',
  },
});
</script>

<template>
  <svg width="10" height="16" viewBox="0 0 10 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 14L8 8L2 2" :stroke="color" stroke-width="1.5" stroke-linecap="square"/>
  </svg>
</template>
