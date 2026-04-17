<script setup>

const { unit, building } = defineProps({
  unit: {
    type: Object,
    required: true,
  },
  building: {
    type: Object,
  }
});

</script>

<template>
  <div class="tw-rounded-lg tw-border tw-border-dark tw-p-3 tw-flex tw-items-start tw-bg-white tw-gap-3">
    <figure class="tw-w-[158px] tw-h-[128px] tw-p-3">
      <img class="tw-w-full tw-h-full tw-object-cover" :src="unit.unit_plans[0]?.filename" :alt="unit.name">
    </figure>
    <div class="tw-w-full">
      <div class="tw-flex tw-justify-between tw-items-center tw-mb-3">
        <span class="tw-font-semibold">{{ unit.name }}</span>

        <span class="tw-rounded tw-capitalize tw-px-2 tw-py-0.5 tw-text-sm tw-text-secondary-dark tw-bg-[#EAE9D7]">
          {{ building.name }}
        </span>
      </div>

      <div>
        <ul class="tw-space-y-1">
          <li class="tw-flex tw-justify-between tw-items-center">
            <span class="tw-text-secondary-dark tw-text-sm">Living area</span>
            <span class="tw-font-semibold tw-text-sm">{{ unit.unit_area }} {{ unit.area_unit?.toLowerCase() }}</span>
          </li>

          <li class="tw-flex tw-justify-between tw-items-center">
            <span class="tw-text-secondary-dark tw-text-sm">Balcony</span>
            <span class="tw-font-semibold tw-text-sm">{{ unit.balcony_area }} {{ unit.area_unit?.toLowerCase() }}</span>
          </li>

          <li class="tw-flex tw-justify-between tw-items-center">
            <span class="tw-text-secondary-dark tw-text-sm">Bedroom</span>
            <span class="tw-font-semibold tw-text-sm" v-if="unit.number_of_bedrooms === 0">Studio</span>
            <span class="tw-font-semibold tw-text-sm" v-else>{{ unit.number_of_bedrooms }}</span>
          </li>

          <li class="tw-flex tw-justify-between tw-items-center">
            <span class="tw-text-secondary-dark tw-text-sm">Floor</span>
            <span class="tw-font-semibold tw-text-sm">{{ unit.floor }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped lang="sass">

</style>
