<script setup>
import { defineAsyncComponent } from 'vue';

const props = defineProps({
  icon: {
    type: String,
    required: true,
  },
})

const icon = defineAsyncComponent(() => import(`@/icons/${props.icon}.svg`));
</script>

<template>
  <component :is="icon" />
</template>
