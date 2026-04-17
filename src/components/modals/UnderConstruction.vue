<script setup>
import RegistrationModal from "@/components/modals/RegistrationModal.vue";
import { ref } from "vue";

const registrationModal = ref();
const { building } = defineProps({
  building: {
    type: Object,
  }
});
</script>

<template>
  <div v-if="building.interactive_map_no_units_banner_title || building.interactive_map_no_units_banner_description">
    <div
      class="tw-fixed tw-max-w-[374px] tw-bottom-40 tw-left-0 tw-right-0 tw-mx-auto tw-bg-[#232323] tw-bg-opacity-85 tw-p-3 tw-rounded-xl tw-text-white tw-text-center tw-z-10">
      <div class="tw-mb-6">
        <span
          class="tw-inline-block tw-px-4 tw-py-2 tw-bg-[#999] tw-bg-opacity-50 tw-rounded tw-mb-4 tw-font-medium tw-text-xs">
          Under construction
        </span>

        <p class="tw-text-lg tw-font-semibold tw-mb-1">
          {{ building.interactive_map_no_units_banner_title }}
        </p>

        <p>
          {{ building.interactive_map_no_units_banner_description }}
        </p>
      </div>

      <button @click.prevent="registrationModal.open()"
        class="tw-bg-secondary-primary tw-rounded-lg tw-font-semibold tw-py-3 tw-w-full tw-text-white">
        Register interest
      </button>
    </div>

    <RegistrationModal ref="registrationModal" :building="building" />
  </div>
</template>
