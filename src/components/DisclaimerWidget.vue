<script setup>
import {onMounted, onUnmounted, ref} from "vue";
const disclaimer = ref(false);
const disclaimerRef = ref(false);
const showDisclaimer = () => {
  disclaimer.value = !disclaimer.value;
}
const handleClickOutside = (event) => {
  if (disclaimerRef.value && !disclaimerRef.value.contains(event.target)) {
    disclaimer.value = false;
  }
}
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="tw-fixed tw-rounded-lg lg:tw-p-2 tw-bottom-4 tw-left-2 lg:tw-bottom-2 lg:tw-left-6 tw-flex tw-items-start tw-gap-1  tw-bg-[#232323] tw-bg-opacity-50 tw-z-50">

    <button @click="showDisclaimer" ref="disclaimerRef" class="tw-p-2 lg:tw-hidden">
      <svg width="17" height="14" viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1.55336 11.4651L7.76136 1.46896C8.1496 0.84368 9.05039 0.84368 9.43863 1.46896L15.6466 11.4651C16.061 12.1323 15.587 13 14.8079 13H2.39208C1.61304 13 1.13896 12.1323 1.55336 11.4651V11.4651Z" stroke="#FFD966" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8.6 4.2V8.2" stroke="#FFD966" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8.6 9.8V10.6" stroke="#FFD966" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <span class="max-lg:tw-hidden">
      <svg width="17" height="14" viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1.55336 11.4651L7.76136 1.46896C8.1496 0.84368 9.05039 0.84368 9.43863 1.46896L15.6466 11.4651C16.061 12.1323 15.587 13 14.8079 13H2.39208C1.61304 13 1.13896 12.1323 1.55336 11.4651V11.4651Z" stroke="#FFD966" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8.6 4.2V8.2" stroke="#FFD966" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8.6 9.8V10.6" stroke="#FFD966" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>

    <div
         :class="[disclaimer ? 'max-lg:tw-block max-lg:tw-bg-[#232323] max-lg:tw-bg-opacity-85 tw-rounded max-lg:tw-p-2' : 'max-lg:tw-hidden']"
         class="max-lg:tw-fixed tw-transition-all max-lg:tw-bottom-2 max-lg:tw-left-2 tw-text-white tw-text-xs -tw-letter-spacing-[0.5px] tw-w-full tw-max-w-[276px]">
      <p>
        <span class="tw-font-semibold">Disclaimer:</span>
        The official prices are in AED. Prices displayed in other currencies are for reference only and may vary
        based on exchange rates.
      </p>
    </div>
  </div>
</template>
