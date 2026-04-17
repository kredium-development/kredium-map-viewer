<script setup>

const mode = defineModel({
  default: 'day',
  validator: (value) => ['day', 'night'].includes(value)
});

defineProps({
  hasNightImages: {
    type: Boolean,
    default: false
  },
  inline: {
    type: Boolean,
    default: false
  }
});

const toggleMode = () => {
  mode.value = mode.value === 'day' ? 'night' : 'day';
};
</script>

<template>
  <div v-if="hasNightImages" :class="inline ? 'tw-relative tw-z-10' : 'tw-fixed tw-top-6 tw-right-6 tw-z-10'">
    <div
      class="tw-rounded-lg tw-flex tw-items-center tw-bg-[#232323] tw-bg-opacity-85"
    >
      <button
        @click="toggleMode()"
        class="tw-p-1 tw-w-10 tw-h-10 tw-text-secondary-white tw-rounded-lg tw-flex tw-flex-1 tw-justify-center tw-items-center tw-gap-2 tw-transition-all tw-text-sm tw-border tw-border-silver tw-border-opacity-0 hover:tw-border-opacity-30"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="tw-w-4 tw-h-4 tw-absolute tw-transition tw-duration-500"
          :class="modelValue === 'day' ? 'tw-opacity-0' : 'tw-opacity-100'"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="tw-w-4 tw-h-4 tw-absolute tw-transition tw-duration-500"
          :class="modelValue === 'night' ? 'tw-opacity-0' : 'tw-opacity-100'"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </button>
    </div>
  </div>
</template>
