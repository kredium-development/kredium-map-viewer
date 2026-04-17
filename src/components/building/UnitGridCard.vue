<script setup>
import { formatNumber } from "@/mixins/formatNumber.js";

const { unit } = defineProps({
  unit: {
    type: Object,
    required: true,
  },
});

</script>

<template>
  <div
    class="tw-cursor-pointer tw-bg-white tw-overflow-hidden tw-border tw-rounded-xl max-[768px]:tw-w-full tw-w-[292px] tw-text-left hover:tw-border-[#232323]">
    <figure v-if="unit.unit_plans" class="tw-m-0 tw-h-[204px]">
      <img :src="unit.unit_plans[0]?.filename" class="tw-w-full tw-h-full tw-object-center tw-object-cover"
        alt="Flat name">
    </figure>

    <div class="tw-border-t tw-bg-silver tw-p-3">
      <div class='tw-mb-3 tw-flex tw-justify-between tw-items-center'>
        <span class='tw-font-semibold'>{{ unit.name }}</span>

        <span class='tw-text-[#4B4144] tw-text-xs tw-px-1 tw-py-0.5 tw-bg-[#EAE9D7] tw-rounded-sm'>
            {{ unit.layout_code }}
          </span>
      </div>

      <div class="tw-flex tw-items-center tw-mb-8 tw-space-x-2">
        <span class="tw-text-secondary-dark tw-text-sm tw-flex tw-items-center">
          <span>
              {{ unit.number_of_bedrooms === 0 ? 'Studio' : unit.number_of_bedrooms + ' BR' }}
              {{ unit.study ? ' + study' : '' }}
              {{ unit.maid ? ' + maid' : '' }}
          </span>
        </span>

        <hr class="tw-w-[1px] tw-h-4 tw-bg-[#D6D6D6]" />

        <span class="tw-text-secondary-dark tw-text-sm tw-flex tw-items-center">
          Floor {{ unit.floor }}
        </span>

        <hr class="tw-w-[1px] tw-h-4 tw-bg-[#D6D6D6]" />

        <span class="tw-text-secondary-dark tw-text-sm tw-flex tw-items-center">
          {{ unit.unit_area }} {{ unit.area_unit?.toLowerCase() }}
        </span>
      </div>

      <template v-if="unit.price">
        <div class='tw-flex tw-justify-between tw-items-center tw-rounded-lg tw-bg-[#545454] tw-px-3 tw-py-2'>
          <span class='tw-text-white tw-font-semibold'>
            {{ !unit.price ? 'Ask for price' : (unit.price_currency + ' ' + formatNumber(unit.price)) }}
          </span>
          <span>
              <svg width="18" height="9" viewBox="0 0 18 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.6668 4.5127H1.3335" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M13.3335 7.84635L16.6668 4.51302L13.3335 1.17969" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
        </div>
      </template>

      <template v-else>
        <button
          class="tw-rounded-lg tw-w-full tw-bg-dark tw-px-3 tw-h-[48px] tw-text-lg tw-text-white tw-font-semibold tw-flex tw-items-center">
          Ask for a price

          <span class="tw-ml-auto">
            <svg width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.3999 9L14.3999 9" stroke="white" stroke-width="1.5" stroke-linecap="square" />
              <path d="M8.3999 2L15.3999 9L8.3999 16" stroke="white" stroke-width="1.5" stroke-linecap="square" />
            </svg>
          </span>
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped lang="sass">

</style>
