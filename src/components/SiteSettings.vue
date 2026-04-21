<script setup>
import { useSettingsStore } from '@/stores/settingsStore';
import CustomDropdown from './CustomDropdown.vue';
import { computed } from 'vue';

const settings = useSettingsStore();

const availableCurrencies = computed(() => (settings.getAvailableCurrencies ?? []).map((currency) => ({
  label: currency,
  value: currency,
})));
const availableMeasurements = computed(() => (settings.getAvailableMeasurements ?? []).map((currency) => ({
  label: currency,
  value: currency,
})));
</script>

<template>
  <CustomDropdown
    v-if="availableCurrencies.length > 1 || availableMeasurements.length > 1"
    icon="settings"
    class="tw-bg-[#232323] tw-bg-opacity-85 tw-z-20 tw-ml-auto tw-flex tw-items-center tw-h-10 lg:tw-h-[52px]"
    dropdown-class="tw-text-white tw-bg-[#232323] tw-bg-opacity-85 tw-min-w-full tw-flex tw-flex-col tw-gap-4 tw-min-w-[140px]"
  >
    <template #dropdown>
      <div v-if="availableCurrencies.length > 1">
        <label class="tw-text-xs tw-mb-1">Select currency</label>
        <CustomDropdown
          class="tw-bg-[#DADADA] tw-text-[#5C4C37]"
          :items="availableCurrencies"
          open-icon="chevron_down_brown"
          close-icon="chevron_up_brown"
          :model-value="settings.getCurrency"
          @update:modelValue="settings.setCurrency"
        />
      </div>
      <div v-if="availableMeasurements.length > 1">
        <label class="tw-text-xs tw-mb-1">Select size unit</label>
        <div class="tw-flex tw-gap-2">
          <button v-for="unit in availableMeasurements"
            :key="unit.value"
            @click="settings.setMeasurement(unit.value)"
            :class="settings.getMeasurement === unit.value ? 'tw-bg-[#DADADA] tw-text-[#5C4C37]' : ''"
            class="tw-py-1 tw-px-3 tw-rounded tw-text-sm">
            {{ unit.label.toLowerCase() }}
          </button>
        </div>
      </div>
    </template>
  </CustomDropdown>

  <!-- <div class="tw-flex tw-gap-1.5 tw-items-center tw-mr-2.5">
            <span>{{ settings.getCurrency }}</span>
            <div class="tw-bg-white tw-rounded tw-w-[1.5px] tw-h-4"></div>
            <span>{{ settings.getMeasurement }}</span>
          </div> -->
</template>
