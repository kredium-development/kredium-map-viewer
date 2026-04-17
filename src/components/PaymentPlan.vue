<script setup>
import 'swiper/css';
import { ref } from "vue";
import { register } from 'swiper/element/bundle';
import '@justinribeiro/lite-youtube';
import UnitService from "@/api/services/Unit.js";
import {useRoute} from "vue-router";
import PaymentPlanTable from "./PaymentPlanTable.vue";
import ClickOutside from "@/components/ClickOutside.vue";

const route = useRoute();
const embedUuid = route.params.embedUuid;

register();

const paymentPlanTable = ref({});
const paymentPlanTabs = ref([]);
const activePaymentPlanTab = ref();

const showGallery = ref(false);
const closeGallery = () => {
  showGallery.value = false;
};

const loadPaymentPlans = (uId) => {
  (new UnitService()).paymentPlans(embedUuid, uId)
    .then((res) => {
      paymentPlanTable.value = {};
      paymentPlanTabs.value = [];
      res.data.forEach((item) => {
        paymentPlanTabs.value.push(item.name);
        paymentPlanTable.value[item.name] = item;
      });
      setActivePaymentPlanTab(paymentPlanTabs.value[0]);
    });
}

const open = (uIdToShowPlanFor) => {
  showGallery.value = true;
  loadPaymentPlans(uIdToShowPlanFor)
};

const openWithPaymentPlan = (paymentPlans) => {
  showGallery.value = true;
  paymentPlanTable.value = paymentPlans;
  paymentPlanTabs.value = Object.keys(paymentPlans);
  setActivePaymentPlanTab(paymentPlanTabs.value[0]);
};

const setActivePaymentPlanTab = (tab) => {
  activePaymentPlanTab.value = tab
}

defineExpose({
  open, openWithPaymentPlan
});
</script>

<template>
  <div
    :class="[showGallery ? 'tw-fixed' : 'tw-hidden']"
    class="tw-bg-[#232323] tw-bg-opacity-45 md:tw-p-5 tw-w-full tw-top-0 tw-h-full !tw-m-0 tw-left-0 tw-z-[9999] tw-items-center tw-flex-col">
    <ClickOutside @close="closeGallery" class="tw-h-full tw-flex tw-items-center">
      <div class="tw-max-w-[1170px] tw-w-full tw-mx-auto tw-relative max-md:tw-p-0">
        <div class="tw-flex tw-justify-end tw-mb-4 max-md:tw-px-5 max-md:tw-pt-5">
          <button @click.prevent="closeGallery"
                  class="tw-cursor-pointer tw-ml-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19 5L5 19" stroke="#E5E5E5" stroke-width="1.5" stroke-linecap="square"/>
              <path d="M5 5L19 19" stroke="#E5E5E5" stroke-width="1.5" stroke-linecap="square"/>
            </svg>
          </button>
        </div>

        <div class="tw-w-full tw-mx-auto tw-relative tw-bg-white tw-rounded tw-p-4">
          <div class="tw-p-0.5 tw-border tw-border-stroke tw-overflow-x-auto tw-flex tw-items-start tw-gap-2 tw-rounded tw-mb-2 tw-text-sm tw-w-fit">
            <button
              v-for="(tab, i) in paymentPlanTabs" :key="i"
              @click="setActivePaymentPlanTab(tab)"
              class="tw-px-3 tw-py-1 tw-flex-shrink-0"
              :class="{
                'tw-bg-[#EAE9D7] tw-text-[#5C4C37] tw-rounded': activePaymentPlanTab === tab,
                'tw-bg-white': activePaymentPlanTab !== tab,
              }"
            >{{ tab }}</button>
          </div>

          <PaymentPlanTable v-if="activePaymentPlanTab" :paymentPlan="paymentPlanTable[activePaymentPlanTab]" />
        </div>
      </div>
    </ClickOutside>
  </div>
</template>
