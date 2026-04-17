<script setup>
import {formatNumber} from "@/mixins/formatNumber.js";
import {ref} from "vue";
import InlineSvg from "../InlineSvg.vue";

const {hasPaymentPlans, viewMode} = defineProps({
  hasPaymentPlans: {
    type: Boolean,
    required: false,
  },
  viewMode: {
    type: String,
    required: false,
    default: 'day',
  },
});

const emit = defineEmits(['cardClicked',
  'open-iframe-gallery',
  'open-unit-gallery',
  'open-payment-plan',
])
const unit = ref();

const close = () => {
  unit.value = null;
}

const open = (u) => {
  unit.value = u;
}

const openUnitGallery = (image) => {
  emit('open-unit-gallery', image)
};

const openPaymentPlan = () => {
    emit('open-payment-plan', unit.value.uuid)
};

const openIframeGallery = (link) => {
  emit('open-iframe-gallery', link)
};

defineExpose({ open, close });

</script>

<template>
  <div>
    <div class="tw-min-w-[272px]"
         @click="emit('cardClicked', unit)"
         :class="{ 'tw-hidden': !unit }" >

      <button
        @click.stop="close"
        class="tw-mb-1 tw-justify-self-end tw-bg-[#232323] tw-bg-opacity-50 tw-w-[22px] tw-h-[22px] tw-flex tw-items-center tw-justify-center tw-rounded-sm">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.7082 1.47168L1.2915 14.8883" stroke="#EDEDED" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M1.2915 1.47168L14.7082 14.8883" stroke="#EDEDED" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <div class='tw-bg-[#F7F6F5] tw-overflow-hidden tw-border tw-border-[#232323] tw-border-opacity-48 tw-rounded tw-cursor-pointer'
           v-if="unit">
        <figure v-if="unit.unit_plans" class='tw-m-0 tw-h-[196px] tw-relative'>
          <img
            :src="unit.unit_plans[0]?.filename"
            class='tw-w-full tw-h-full tw-object-center tw-object-cover'
            alt='Flat name'
          />
        </figure>

        <div class='tw-border-t tw-bg-silver tw-p-2'>
          <div class='tw-mb-2 tw-flex tw-justify-between tw-items-center'>
            <span class='tw-font-semibold'>{{ unit.name }}</span>

            <span v-if="unit.layout_code" class='tw-text-[#4B4144] tw-text-xs tw-px-1 tw-py-0.5 tw-bg-[#EAE9D7] tw-rounded-sm'>
            {{ unit.layout_code }}
          </span>
          </div>

          <div class='tw-flex tw-gap-2 tw-items-center tw-mb-3 tw-justify-start'>
              <span class='tw-text-secondary-dark tw-text-sm tw-flex tw-items-center'>
                <span>{{ unit.number_of_bedrooms === 0 ? 'Studio' : unit.number_of_bedrooms + ' BR' }}</span>
                <span v-if="unit.study">&nbsp;+ study</span>
                <span v-if="unit.maid">&nbsp;+ maid</span>
              </span>

            <hr class='tw-w-[1px] tw-h-5 tw-bg-[#D6D6D6]' />

            <span class='tw-text-secondary-dark tw-text-sm tw-flex tw-items-center'>
            Floor {{ unit.floor}}
          </span>

            <hr class='tw-w-[1px] tw-h-5 tw-bg-[#D6D6D6]' />

            <span class='tw-text-secondary-dark tw-text-sm tw-flex tw-items-center'>
            {{ unit.unit_area }} {{ unit.area_unit?.toLowerCase() }}
          </span>
          </div>

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
        </div>
      </div>

      <div v-if="(unit?.unit_plans && unit.unit_plans[0]) || hasPaymentPlans || unit?.media_360_link || unit?.video_links[0] || unit?.views?.[viewMode]?.link"
        class="tw-flex tw-w-fit tw-gap-1 tw-mt-2 tw-bg-white tw-p-1 tw-rounded">
        <button v-if="unit?.unit_plans && unit.unit_plans[0]" @click.stop="openUnitGallery(unit.unit_plans[0].filename)" class="tw-justify-self-end tw-bg-[#232323] tw-bg-opacity-90 tw-border tw-border-white tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded-sm">
          <InlineSvg icon="plans" />
        </button>

        <button v-if="hasPaymentPlans" @click.stop="openPaymentPlan" class="tw-justify-self-end tw-bg-[#232323] tw-bg-opacity-90 tw-border tw-border-white tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded-sm">
          <InlineSvg icon="cash" />
        </button>

        <button v-if="unit?.media_360_link" @click.stop="openIframeGallery(unit.media_360_link)" class="tw-justify-self-end tw-bg-[#232323] tw-bg-opacity-90 tw-border tw-border-white tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded-sm">
          <InlineSvg icon="360_person" />
        </button>

        <button v-if="unit?.video_links[0]" @click.stop="openIframeGallery(unit.video_links[0].link)" class="tw-justify-self-end tw-bg-[#232323] tw-bg-opacity-90 tw-border tw-border-white tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded-sm">
          <InlineSvg icon="video" />
        </button>

        <button v-if="unit?.views?.[viewMode]?.link" @click.stop="openIframeGallery(unit.views[viewMode].link)" class="tw-justify-self-end tw-bg-[#232323] tw-bg-opacity-90 tw-border tw-border-white tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded-sm">
          <InlineSvg icon="view" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="sass">

</style>
