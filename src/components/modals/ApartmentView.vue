<script setup>
import ArrowRight from "@/components/icons/ArrowRight.vue";
import {computed, ref, watch} from "vue";
import {formatNumber} from "@/mixins/formatNumber.js";
import RegistrationModal from "@/components/modals/RegistrationModal.vue";
import ModalLayout from "@/components/modals/ModalLayout.vue";
import GalleryCarousel from "@/components/GalleryCarousel.vue";
import PaymentPlan from "@/components/PaymentPlan.vue";
import UnitService from "@/api/services/Unit.js";
import {useRoute} from "vue-router";
import PaymentPlanTable from "../PaymentPlanTable.vue";
import { useSettingsStore } from "@/stores/settingsStore";

const route = useRoute();
const embedUuid = route.params.embedUuid;

const { building, viewMode } = defineProps({
  building: {
    type: Object,
  },
  viewMode: {
    type: String,
    required: false,
    default: 'day',
  },
});
const unit = ref();
const registrationModal = ref();
const isModalOpened = ref(false);
const openCard = ref(false);
const animationDurationMs = 100;
const gallery = ref();
const iFrame = ref();
const activeTab = ref('Floor plan');
const activePaymentPlanTab = ref();
const paymentPlanTabs = ref([]);
const activeFrame = ref();
const paymentPlanRef = ref();
const paymentPlanTable = ref(null);
const acceptSettingsUpdate = ref(true);
const settingsStore = useSettingsStore();

// Tabs display computed properties
const showFloorPlansTab = computed(() => unit.value.unit_plans?.length);
const show3dViewTab = computed(() => unit.value.media_360_link);
const showPaymentPlansTab = computed(() => building.payment_plans_count > 0);
const showBalconyViewTab = computed(() => unit.value.views && unit.value.views?.[viewMode]?.link);

const onSettingsChanged = (_new, old) => {
  if(old !== null && unit.value && acceptSettingsUpdate.value) {
    acceptSettingsUpdate.value = false;
    paymentPlanTable.value = null;
    loadPaymentPlans(unit.value.uuid);
    reloadUnit(unit.value.uuid);
  }
};

watch(() => settingsStore.getCurrency, onSettingsChanged);

const close = () => {
  openCard.value = false;
  setTimeout(() => {
    isModalOpened.value = !isModalOpened.value
  }, animationDurationMs)
};

const open = async (u) => {
  // If we open same component with different unit and payment plan tab is selected already,
  // we should instantly load payment plans for the new unit.
  if(activeTab.value === 'Payment plan' && u.uuid !== unit.value.uuid) {
    paymentPlanTable.value = null;
    loadPaymentPlans(u.uuid)
  }

  unit.value = u;
  isModalOpened.value = true;

  if(!showFloorPlansTab.value && showPaymentPlansTab.value) {
    setActiveTab('Payment plan');
  } else if (!showFloorPlansTab.value && !showPaymentPlansTab.value && show3dViewTab.value) {
    setActiveTab('3D tour');
  } else if (!showFloorPlansTab.value && !showPaymentPlansTab.value && !show3dViewTab.value && showBalconyViewTab.value) {
    setActiveTab('View');
  }

  setTimeout(() => {
    openCard.value = true;
  }, animationDurationMs)
};

const openIframe = (link) => {
  activeFrame.value = link
  iFrame.value.open(link)
}

const openPaymentPlan = () => {
  paymentPlanRef.value.openWithPaymentPlan(paymentPlanTable.value)
}

const openGallery = (i) => {
  gallery.value.open(i);
};

const reloadUnit = (unitId) => {
  (new UnitService()).getUnit(embedUuid, unitId)
    .then((res) => {
      unit.value = res.data;
    });
};

const loadPaymentPlans = (uId) => {
  if(paymentPlanTable.value !== null || building.payment_plans_count === 0) {
    acceptSettingsUpdate.value = true;
    return;
  }

  (new UnitService()).paymentPlans(embedUuid, uId)
    .then((res) => {
      paymentPlanTabs.value = [];
      paymentPlanTable.value = {};

      res.data.forEach((item, idx) => {
        if(idx === 0) {
          setActivePaymentPlanTab(item.name);

          if(item.total_price_formatted) {
            unit.value = {
              ...unit.value,
              price_formatted: item.total_price_formatted
            };
          }
        }
        paymentPlanTabs.value.push(item.name);
        paymentPlanTable.value[item.name] = item;
      });
    })
    .finally(() => acceptSettingsUpdate.value = true);
}

const setActiveTab = (tab) => {
  if (tab === 'Payment plan') {
    loadPaymentPlans(unit.value.uuid)
  }
  activeTab.value = tab
}

const setActivePaymentPlanTab = (tab) => {
  activePaymentPlanTab.value = tab

  if(paymentPlanTable.value && paymentPlanTable.value[tab]?.total_price_formatted) {
    unit.value = {
      ...unit.value,
      price_formatted: paymentPlanTable.value[tab].total_price_formatted
    };
  }
}

defineExpose({ open })

</script>

<template>
  <ModalLayout :is-open="isModalOpened" @modal-close="close">
    <div
      class="tw-absolute tw-h-full tw-transition-all tw-top-0 tw-z-30 tw-overflow-y-auto tw-bg-silver tw-p-6 tw-pt-0 tw-w-[518px] tw-max-w-full"
      :class="{
      'tw-right-0' : openCard,
      '-tw-right-full': !openCard,
      'tw-duration-100': animationDurationMs === 100
      }">
      <div class="tw-space-y-6">
        <div>
          <div class="tw-sticky tw-pt-6 tw-pb-3 tw-top-0 tw-bg-silver">
            <button class="tw-flex tw-items-center" @click.prevent="close">
              Close
              <span class="tw-ml-2">
                <ArrowRight />
              </span>
            </button>
          </div>

          <div class="tw-space-y-6">
            <div>
              <div class="tw-flex tw-overflow-x-auto tw-items-start tw-gap-2 tw-mb-4">
                <button
                  v-if="showFloorPlansTab"
                  @click="setActiveTab('Floor plan')"
                  class="tw-px-4 tw-py-2 tw-flex-shrink-0 tw-rounded tw-border tw-border-stroke "
                  :class="[activeTab === 'Floor plan' ? 'tw-text-white tw-bg-[#867448]' : 'tw-bg-white tw-text-[#867448]']"
                >
                  Floor plan
                </button>

                <button
                  v-if="showPaymentPlansTab"
                  @click="setActiveTab('Payment plan')"
                  class="tw-px-4 tw-py-2 tw-flex-shrink-0 tw-rounded tw-border tw-border-stroke "
                  :class="[activeTab === 'Payment plan' ? 'tw-text-white tw-bg-[#867448]' : 'tw-bg-white tw-text-[#867448]']"
                >
                  Payment plan
                </button>

                <button
                  v-if="show3dViewTab"
                  @click="setActiveTab('3D tour')"
                  class="tw-px-4 tw-py-2 tw-flex-shrink-0 tw-rounded tw-border tw-border-stroke "
                  :class="[activeTab === '3D tour' ? 'tw-text-white tw-bg-[#867448]' : 'tw-bg-white tw-text-[#867448]']"
                >
                  3D tour
                </button>

                <button
                  v-if="showBalconyViewTab"
                  @click="setActiveTab('View')"
                  class="tw-px-4 tw-py-2 tw-flex-shrink-0 tw-rounded tw-border tw-border-stroke "
                  :class="[activeTab === 'View' ? 'tw-text-white tw-bg-[#867448]' : 'tw-bg-white tw-text-[#867448]']"
                >
                  View
                </button>
              </div>

              <template v-if="showFloorPlansTab && activeTab === 'Floor plan'">
                <div class="tw-bg-white tw-relative tw-cursor-pointer tw-h-[340px] tw-overflow-hidden tw-rounded tw-border tw-border-[#232323] tw-border-opacity-50">

                  <figure class="tw-w-full tw-h-full tw-m-0 tw-relative tw-cursor-pointer" @click="openGallery(0)">
                    <img :src="unit.unit_plans[0]?.filename" class="tw-w-full tw-h-full tw-object-center tw-object-cover"
                         alt="Flat name">
                    <button class="tw-flex tw-items-center tw-rounded tw-px-3 tw-py-1.5 tw-text-white tw-absolute tw-right-4 tw-bottom-4 tw-bg-[#232323] tw-bg-opacity-70">
                  <span class="tw-mr-2">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.3999 16.6L6.9999 11" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M16.6 16.6L11 11" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M1.3999 1.40039L6.9999 7.00039" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M16.6 1.40039L11 7.00039" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M1.3999 12.5996V16.5996H5.3999" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M16.6001 12.5996V16.5996H12.6001" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M1.3999 5.40039V1.40039H5.3999" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M16.6001 5.40039V1.40039H12.6001" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>

                      Full screen
                    </button>
                  </figure>
                </div>
              </template>

              <template v-if="showPaymentPlansTab && activeTab === 'Payment plan'">

                <div class="tw-p-0.5 tw-bg-white tw-border tw-border-stroke tw-overflow-x-auto tw-flex tw-items-start tw-gap-2 tw-rounded tw-mb-2 tw-text-sm tw-w-fit">
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

                <PaymentPlanTable v-if="activePaymentPlanTab && paymentPlanTable && paymentPlanTable[activePaymentPlanTab]" :payment-plan="paymentPlanTable[activePaymentPlanTab]" />

                <div class="tw-flex tw-items-center tw-justify-end tw-gap-2 tw-mt-2">

                  <button
                    @click="openPaymentPlan"
                    class="tw-flex tw-items-center tw-rounded tw-px-3 tw-py-1.5 tw-text-white tw-bg-[#232323] tw-bg-opacity-70">
                      <span class="tw-mr-2">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1.3999 16.6L6.9999 11" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M16.6 16.6L11 11" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M1.3999 1.40039L6.9999 7.00039" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M16.6 1.40039L11 7.00039" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M1.3999 12.5996V16.5996H5.3999" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M16.6001 12.5996V16.5996H12.6001" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M1.3999 5.40039V1.40039H5.3999" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M16.6001 5.40039V1.40039H12.6001" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </span>
                    Full screen
                  </button>
                </div>
              </template>

              <template v-if="show3dViewTab && activeTab === '3D tour'">
                <div class="tw-bg-white tw-relative tw-cursor-pointer tw-h-[340px] tw-overflow-hidden tw-rounded tw-border tw-border-[#232323] tw-border-opacity-50">
                  <div class="tw-relative tw-h-full">
                    <iframe class="tw-w-full tw-h-full" :src="unit.media_360_link" frameborder="0"></iframe>

                    <button
                      @click="openIframe(unit.media_360_link)"
                      class="tw-flex tw-items-center tw-rounded tw-px-3 tw-py-1.5 tw-text-white tw-absolute tw-right-4 tw-bottom-4 tw-bg-[#232323] tw-bg-opacity-70">
                      <span class="tw-mr-2">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1.3999 16.6L6.9999 11" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M16.6 16.6L11 11" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M1.3999 1.40039L6.9999 7.00039" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M16.6 1.40039L11 7.00039" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M1.3999 12.5996V16.5996H5.3999" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M16.6001 12.5996V16.5996H12.6001" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M1.3999 5.40039V1.40039H5.3999" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M16.6001 5.40039V1.40039H12.6001" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </span>
                      Full screen
                    </button>
                  </div>
                </div>
              </template>

              <template v-if="showBalconyViewTab && activeTab === 'View'">
                <div class="tw-bg-white tw-relative tw-cursor-pointer tw-h-[340px] tw-overflow-hidden tw-rounded tw-border tw-border-[#232323] tw-border-opacity-50">
                  <div class="tw-relative tw-h-full">
                    <iframe class="tw-w-full tw-h-full" :src="unit.views[viewMode].link" frameborder="0"></iframe>

                    <button
                      @click="openIframe(unit.views[viewMode].link)"
                      class="tw-flex tw-items-center tw-rounded tw-px-3 tw-py-1.5 tw-text-white tw-absolute tw-right-4 tw-bottom-4 tw-bg-[#232323] tw-bg-opacity-70">
                      <span class="tw-mr-2">
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1.3999 16.6L6.9999 11" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M16.6 16.6L11 11" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M1.3999 1.40039L6.9999 7.00039" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M16.6 1.40039L11 7.00039" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M1.3999 12.5996V16.5996H5.3999" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M16.6001 12.5996V16.5996H12.6001" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M1.3999 5.40039V1.40039H5.3999" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M16.6001 5.40039V1.40039H12.6001" stroke="#E5E5E5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </span>
                      Full screen
                    </button>
                  </div>
                </div>
              </template>
            </div>

            <hr v-if="showPaymentPlansTab || show3dViewTab || showBalconyViewTab  || showFloorPlansTab" class="tw-border-dashed tw-border-1 tw-border-[#C5C5C5]">

            <div class="tw-bg-white tw-p-3 tw-overflow-hidden">
              <div class="tw-flex tw-justify-between tw-items-center tw-mb-3">
                <span class="tw-text-2xl">{{ unit.name }}</span>
                <span class="tw-rounded tw-capitalize tw-px-2 tw-py-0.5 tw-text-sm tw-text-secondary-dark tw-bg-[#EAE9D7]">
                  {{ building.name }}
                </span>
              </div>

              <div>
                <ul class="tw-divide-y">
                  <li class="tw-flex tw-justify-between tw-items-center tw-py-2" v-if="unit.number_of_bedrooms !== null">
                    <span class="tw-text-secondary-dark">Bedrooms</span>
                    <span class="tw-font-semibold" v-if="unit.number_of_bedrooms === 0">Studio {{ unit.study ? ' + study' : '' }} {{ unit.maid ? ' + maid' : '' }}</span>
                    <span class="tw-font-semibold" v-else>{{ unit.number_of_bedrooms + ' BR' }} {{ unit.study ? ' + study' : '' }} {{ unit.maid ? ' + maid' : '' }}</span>
                  </li>

                  <li class="tw-flex tw-justify-between tw-items-center tw-py-2" v-if="unit.number_of_bathrooms">
                    <span class="tw-text-secondary-dark">Bathrooms</span>
                    <span class="tw-font-semibold">{{ unit.number_of_bathrooms }}</span>
                  </li>

                  <li class="tw-flex tw-justify-between tw-items-center tw-py-2" v-if="unit.floor">
                    <span class="tw-text-secondary-dark">Floor</span>
                    <span class="tw-font-semibold">{{ unit.floor }}</span>
                  </li>

                    <li class="tw-flex tw-justify-between tw-items-center tw-py-2" v-if="unit.unit_area">
                        <span class="tw-text-secondary-dark">Unit area</span>
                        <span class="tw-font-semibold">{{ unit.unit_area }} {{ unit.area_unit?.toLowerCase() }}</span>
                    </li>

                  <li class="tw-flex tw-justify-between tw-items-center tw-py-2" v-if="unit.balcony_area">
                    <span class="tw-text-secondary-dark">Balcony area</span>
                    <span class="tw-font-semibold">{{ unit.balcony_area }} {{ unit.area_unit?.toLowerCase() }}</span>
                  </li>

                  <li class="tw-flex tw-justify-between tw-items-center tw-py-2" v-if="unit.garden_area">
                    <span class="tw-text-secondary-dark">Garden area</span>
                    <span class="tw-font-semibold">{{ unit.garden_area }} {{ unit.area_unit?.toLowerCase() }}</span>
                  </li>

                  <li class="tw-flex tw-justify-between tw-items-center tw-py-2" v-if="unit.living_area">
                    <span class="tw-text-secondary-dark">Total area</span>
                    <span class="tw-font-semibold">{{ unit.living_area }} {{ unit.area_unit?.toLowerCase() }}</span>
                  </li>
                </ul>

                <hr class="tw-border-dashed">

                <ul class="tw-mt-2" v-if="unit.price || unit.price_formatted">
                  <li class="tw-flex tw-justify-between tw-items-center tw-bg-gradient-to-r tw-from-transparent tw-to-[#EDEDED]">
                    <span class="tw-text-secondary-dark">Total price</span>
                    <span class="tw-font-semibold tw-tracking-tight tw-text-xl tw-px-4 tw-py-2 tw-rounded tw-text-white tw-bg-[#676767]">
                      {{ unit.price_formatted || (unit.price_currency + ' ' + formatNumber(unit.price)) }}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <button @click.prevent="registrationModal.open(unit)"
                class="tw-bg-dark tw-rounded-lg tw-font-semibold tw-py-3 tw-w-full tw-text-white">
          Register your interest
        </button>
      </div>

      <RegistrationModal ref="registrationModal" :building="building" />
    </div>

    <GalleryCarousel
      :images="unit.unit_plans"
      ref="gallery"
    />

    <PaymentPlan
      v-if="building.payment_plans_count > 0"
      ref="paymentPlanRef"
    />

    <GalleryCarousel
      :iframeLink="activeFrame"
      ref="iFrame"
    />
  </ModalLayout>
</template>
