<script setup>
import { ref } from 'vue';
import InlineSvg from './InlineSvg.vue';
import { useSettingsStore } from '@/stores/settingsStore';

const settings = useSettingsStore();

const {currency, bottomClass} = defineProps({
  currency: {
    type: String,
    required: true
  },
  bottomClass: {
    type: String,
    required: false,
    default: 'tw-bottom-[76px]'
  },
  activeTab: {
    type: String,
    required: false,
  }
});
const opened = ref(false);
const toggle = () => opened.value = !opened.value;
</script>

<template>
  <div
    v-if="settings.getAvailableCurrencies.length > 1"
    @click="toggle"
    class="max-md:tw-cursor-pointer tw-fixed md:tw-bottom-6 tw-left-2 lg:tw-left-6 tw-bg-[#232323]/50 tw-rounded-lg tw-max-w-full md:tw-w-[300px] tw-p-2 tw-flex tw-gap-1 tw-items-start tw-text-xs tw-text-white"
    :class="[bottomClass, { 'max-md:tw-left-[160px]': activeTab === 'plate' }]"
  >
    <div>
      <InlineSvg icon="warning" />
    </div>
    <p
      :class="{'max-md:tw-hidden': !opened, 'max-md:tw-left-[160px]': activeTab === 'plate' }"
      class="max-md:tw-max-w-[360px] max-md:tw-fixed max-md:tw-bottom-[76px] max-md:tw-left-2 max-md:tw-right-2 max-md:tw-bg-[#232323]/90 max-md:tw-rounded-lg max-md:tw-z-50 max-md:tw-p-3 max-md:tw-shadow-lg">
      <strong>Disclaimer:</strong> The official prices are in {{ currency }}. Prices displayed in other currencies are for reference only and may vary based on exchange rates.
    </p>
  </div>
</template>
