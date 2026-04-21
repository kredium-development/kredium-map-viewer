<script setup>
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from "vue";
import FilterCard from "@/components/filter/FilterCard.vue";
import ArrowLeft from "@/components/icons/ArrowLeft.vue";
import PlateView from "@/components/building/PlateView.vue";
import PlansView from "@/components/building/PlansView.vue";
import PlateSceleton from "@/components/sceletons/PlateSceleton.vue";
import BuildingView from "@/components/building/BuildingView.vue";
import {useRoute, useRouter} from "vue-router";
import BuildingService from "@/api/services/Building";
import ApartmentView from "@/components/modals/ApartmentView.vue";
import InfoWidget from "@/components/InfoWidget.vue";
import OptionsWidget from "@/components/OptionsWidget.vue";
import FilterIcon from "@/components/icons/FilterIcon.vue";
import GalleryCarousel from "@/components/GalleryCarousel.vue";
import PaymentPlan from "@/components/PaymentPlan.vue";
import VideoCarousel from "@/components/VideoCarousel.vue";
import SiteSettings from "@/components/SiteSettings.vue";
import { useSettingsStore } from "@/stores/settingsStore";
import ExchangeDisclaimer from "@/components/ExchangeDisclaimer.vue";
import DayNightToggle from "@/components/DayNightToggle.vue";

const showDropdown = ref(false)
const showFilter = ref(false)
const activeTab = ref('3D');
const isElevationMode = ref(false);
const viewMode = ref('day');
const unitDrawer = ref();
const route = useRoute();
const router = useRouter();
const breadcrumbs = ref();
const embedUuid = route.params.embedUuid;
const buildingUuid = route.params.buildingUuid;

const units = ref({});
const building = ref();
const showFullBreadcrumbs = ref(true);
const dropdownRef = ref(null);
const threeSixtyLink = ref('');
const gallery = ref();
const amenityGallery = ref();
const amenityImage = ref();
const videoLink = ref();
const videoGallery = ref();
const unitPlansGallery = ref();
const unitPlanImage = ref();
const paymentPlanRef = ref();
const acceptSettingsUpdate = ref(true);
const settingsStore = useSettingsStore();
const isActive = ref(true)
const floorInput = ref()
const onlyAvailable = ref(false)

const transitionVideo = ref(null);
const transitionVideoSrc = ref(null);
const reverseTransitionVideoSrc = ref(null);
const isTransitioning = ref(false);
const videoFading = ref(false);
const videoReady = ref(false);


const onSettingsChanged = (_new, old) => {
  console.log('[units-debug] onSettingsChanged fired', { _new, old, acceptSettingsUpdate: acceptSettingsUpdate.value });
  if(old !== null && acceptSettingsUpdate.value) {
    console.log('[units-debug] onSettingsChanged CLEARING units.value');
    acceptSettingsUpdate.value = false;
    units.value = {};
    loadBuilding(true);
  }
};

watch(() => settingsStore.getCurrency, onSettingsChanged);
watch(() => settingsStore.getMeasurement, onSettingsChanged);

const setActiveTab = (tab) => {
  activeTab.value = tab;
  if (tab !== '3D') {
    isElevationMode.value = false;
  }

  syncRouteWithState();
  toggleTabs();
};

const open3DView = () => {
  activeTab.value = '3D';
  isElevationMode.value = false;
  syncRouteWithState();
  if (showDropdown.value) {
    toggleTabs();
  }
  ensureBuildingOverlayMode();
};

const openFloorPlansView = () => {
  activeTab.value = 'plans';
  isElevationMode.value = false;
  syncRouteWithState();
  if (showDropdown.value) {
    toggleTabs();
  }
};

const openFloorPlateView = async (reverseTransitionVideoSrc) => {
    const src = typeof reverseTransitionVideoSrc === 'string' && reverseTransitionVideoSrc.length > 0
        ? reverseTransitionVideoSrc
        : null;

    if (src) {
        transitionVideoSrc.value = src;
        isTransitioning.value = true;
        videoFading.value = false;

        await nextTick();
        const video = transitionVideo.value;
        if (video) {
            video.load();
            video.play().catch(err => console.error('Play failed:', err));
            video.ontimeupdate = () => {
                if (video.duration && video.currentTime >= video.duration / 2) {
                    video.ontimeupdate = null;
                    activeTab.value = '3D';
                    isElevationMode.value = true;
                    syncRouteWithState();
                    if (showDropdown.value) {
                        toggleTabs();
                    }
                    ensureBuildingOverlayMode();
                }
            };
        }
    } else {
        activeTab.value = '3D';
        isElevationMode.value = true;
        syncRouteWithState();
        if (showDropdown.value) {
            toggleTabs();
        }
        await ensureBuildingOverlayMode();
    }
};

const toggleTabs = () => {
  showDropdown.value = !showDropdown.value;
};

const toggleFilter = () => {
  showFilter.value = !showFilter.value;
};

const openVideoCarrousel = (i) => {
  videoLink.value = i;
  videoGallery.value.open()
}

const openUnitPlanCarrousel = (image) => {
  unitPlanImage.value = image;
  unitPlansGallery.value.open()
}

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    showDropdown.value = false;
  }
};

const hasUnits = ref(false);
const hasFloorPlate = ref(false);
const hasUnitPlans = ref(false);
const floorUnitStats = ref({});
const selectedFloor = ref(null);
const buildingViewRef = ref(null);
const isApplyingRouteState = ref(false);

const is3DViewActive = computed(() => activeTab.value === '3D' && !isElevationMode.value);
const isFloorPlansActive = computed(() => activeTab.value === 'plans');
const isFloorPlateActive = computed(() => isElevationMode.value || activeTab.value === 'plate');

const ensureBuildingOverlayMode = async () => {
  await nextTick();
  const buildingView = buildingViewRef.value;
  if (!buildingView || activeTab.value !== '3D') return;

  const targetMode = isElevationMode.value ? 'elevation' : 'units';
  if (buildingView.overlayMode !== targetMode) {
    buildingView.toggleFloorPlans();
  }
};

const getQueryState = () => {
  const view = typeof route.query.view === 'string' ? route.query.view : '3d';
  const floorRaw = typeof route.query.floor === 'string' ? route.query.floor : null;
  const floor = floorRaw !== null ? Number.parseInt(floorRaw, 10) : null;

  return {
    view,
    floor: Number.isNaN(floor) ? null : floor,
  };
};

const applyRouteState = async () => {
  const { view, floor } = getQueryState();
  isApplyingRouteState.value = true;

  if (view === 'plate') {
    activeTab.value = 'plate';
    isElevationMode.value = false;
    selectedFloor.value = floor;
  } else if (view === 'elevation') {
    activeTab.value = '3D';
    isElevationMode.value = true;
  } else if (view === 'plans') {
    activeTab.value = 'plans';
    isElevationMode.value = false;
  } else {
    activeTab.value = '3D';
    isElevationMode.value = false;
  }

  if (activeTab.value === '3D') {
    await ensureBuildingOverlayMode();
  }

  isApplyingRouteState.value = false;
};

const syncRouteWithState = () => {
  if (isApplyingRouteState.value) return;

  const nextQuery = { ...route.query };

  if (activeTab.value === 'plate') {
    nextQuery.view = 'plate';

    if (selectedFloor.value !== null && selectedFloor.value !== undefined) {
      nextQuery.floor = String(selectedFloor.value);
    } else {
      delete nextQuery.floor;
    }
  } else if (activeTab.value === 'plans') {
    nextQuery.view = 'plans';
    delete nextQuery.floor;
  } else if (isElevationMode.value) {
    nextQuery.view = 'elevation';
    delete nextQuery.floor;
  } else {
    nextQuery.view = '3d';
    delete nextQuery.floor;
  }

  const currentView = typeof route.query.view === 'string' ? route.query.view : undefined;
  const currentFloor = typeof route.query.floor === 'string' ? route.query.floor : undefined;
  const nextView = typeof nextQuery.view === 'string' ? nextQuery.view : undefined;
  const nextFloor = typeof nextQuery.floor === 'string' ? nextQuery.floor : undefined;

  if (currentView === nextView && currentFloor === nextFloor) {
    return;
  }

  router.push({
    name: route.name,
    params: route.params,
    query: nextQuery,
  });
};

const handleOpenFloorPlate = async ({ floor, videoSrc, reverseVideoSrc }) => {
    const src = typeof videoSrc === 'string' && videoSrc.length > 0 ? videoSrc : null;

    reverseTransitionVideoSrc.value = reverseVideoSrc;

    if (src) {
        transitionVideoSrc.value = src;
        isTransitioning.value = true;
        videoFading.value = false;

        await nextTick();
        const video = transitionVideo.value;
        if (video) {
            video.load();
            video.play().catch(err => console.error('Play failed:', err));

            video.ontimeupdate = () => {
                if (video.duration && video.currentTime >= video.duration / 2) {
                    video.ontimeupdate = null;
                    selectedFloor.value = floor;
                    activeTab.value = 'plate';
                    isElevationMode.value = false;
                }
            };
        }
    } else {
        selectedFloor.value = floor;
        activeTab.value = 'plate';
        isElevationMode.value = false;
    }
};

const onVideoEnded = () => {
    videoFading.value = true;
    syncRouteWithState();
    setTimeout(() => {
        isTransitioning.value = false;
        videoFading.value = false;
    }, 1000);
};

const loadBuilding = (keepSettings = false) => {
  acceptSettingsUpdate.value = false;
  if (!keepSettings) {
    // Clear stale currency/measurement so the first request doesn't send
    // headers that the new project embed may not support (causes 400).
    settingsStore.setDefaults(null, null);
  }

  (new BuildingService()).show(embedUuid, buildingUuid)
    .then((res) => {
      breadcrumbs.value = res.data.breadcrumbs;

      console.log('[units-debug] res.data top-level keys:', Object.keys(res.data));
      console.log('[units-debug] res.data.building keys:', Object.keys(res.data.building ?? {}));
      console.log('[units-debug] res.data.units (top-level):', res.data.units?.length, res.data.units?.[0]);
      console.log('[units-debug] RPC units array length:', res.data.building.units?.length);
      console.log('[units-debug] RPC first unit:', res.data.building.units?.[0]);
      res.data.building.units.forEach(u => {
        units.value[u.uuid] = u;
        hasUnitPlans.value = true;
        hasUnits.value = true;
      })
      console.log('[units-debug] after forEach, units.value keys:', Object.keys(units.value).length);

      if(res.data.building.units[0]?.price_currency_code) {
        settingsStore.setDefaults(res.data.building.units[0]?.price_currency_code, res.data.building.units[0]?.area_unit);
      }

      settingsStore.setAvailableCurrencies(res.data.currencies);
      settingsStore.setAvailableMeasurements(res.data.measurement_units);

      building.value = res.data.building;
      hasFloorPlate.value = building.value.floor_plates.length > 0;
      floorUnitStats.value = res.data.floor_unit_stats || {};
    })
    .finally(() => nextTick(() => { acceptSettingsUpdate.value = true; }));
}

const openUnitDrawer = (unit) => {
  unitDrawer.value.open(unit);
}

const openCarrousel = (i) => {
  threeSixtyLink.value = i;
  gallery.value.open();
}

const openPaymentPlan = (uId) => {
  paymentPlanRef.value.open(uId)
}

const openAmenity = (i) => {
  amenityImage.value = i;
  amenityGallery.value.open(0)
}

const hasNightImages = computed(() => building.value?.images_night && building.value?.images_night.length > 0);

const getBucketStart = (floor) => Math.floor((floor - 1) / 10) * 10 + 1;

/**
 * Group floor plate numbers into decade buckets while keeping only the visible
 * buttons up to the highest existing floor in each bucket.
 *
 * @param {number[]} floorValues
 * @returns {{ key: string, rangeLabel: string, floors: { number: number, exists: boolean }[] }[]}
 */
const buildPlateFloorGroups = (floorValues) => {
  const existingFloors = new Set(floorValues);
  const groupsMap = new Map();

  floorValues.forEach((floor) => {
    const bucketStart = getBucketStart(floor);
    const bucketFloors = groupsMap.get(bucketStart) ?? [];
    bucketFloors.push(floor);
    groupsMap.set(bucketStart, bucketFloors);
  });

  return [...groupsMap.entries()]
    .sort(([leftBucketStart], [rightBucketStart]) => leftBucketStart - rightBucketStart)
    .map(([bucketStart, bucketFloors]) => {
      const bucketEnd = bucketStart + 9;
      const highestExistingFloor = bucketFloors[bucketFloors.length - 1];
      const floors = Array.from(
        { length: highestExistingFloor - bucketStart + 1 },
        (_, index) => ({
          number: bucketStart + index,
          exists: existingFloors.has(bucketStart + index),
        }),
      );

      return {
        key: `${bucketStart}-${bucketEnd}`,
        rangeLabel: `${bucketStart} - ${bucketEnd}`,
        floors,
      };
    });
};

const groupedPlateFloors = computed(() => {
  const floorPlates = building.value?.floor_plates?.length
    ? building.value.floor_plates
    : [];

  const floorValues = floorPlates
    .map((plate) => Number.parseInt(plate.floor, 10))
    .filter((floor) => !Number.isNaN(floor))
    .sort((a, b) => a - b);

  return buildPlateFloorGroups(floorValues);
});

const activePlateFloor = computed(() => {
  if (selectedFloor.value !== null && selectedFloor.value !== undefined) {
    return Number.parseInt(selectedFloor.value, 10);
  }

  const floorPlates = building.value?.floor_plates || [];

  if (floorPlates.length === 0) return null;

  const floors = floorPlates
    .map((plate) => Number.parseInt(plate.floor, 10))
    .filter((floor) => !Number.isNaN(floor));

  return floors.length ? Math.max(...floors) : null;
});

const selectPlateFloor = (floor) => {
  if (Number.isNaN(floor) || floor === null || floor === undefined) return;
  selectedFloor.value = floor;
  floorInput.value = String(floor);
  syncRouteWithState();
};

function getFloorButtonStyle(floor) {
  if (activePlateFloor.value === floor.number) {
    return { color: 'rgba(36, 28, 21, 1)' };
  }
  return {
    color: 'rgba(239, 239, 239, 1)',
    background: 'rgba(35, 35, 35, 0.32)',
    borderColor: 'rgba(248, 248, 248, 0.32)',
  };
}

let debounceTimer = null;

const handleFloorInput = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const num = Number(floorInput.value);
    selectPlateFloor(num);
  }, 300);
};

const onlyNumbers = (e) => {
  if (!/[\d]/.test(e.key)) e.preventDefault();
};

watch(
  () => [route.query.view, route.query.floor],
  () => {
    applyRouteState();
  },
  { immediate: true }
);

watch(
  () => buildingViewRef.value,
  () => {
    if (activeTab.value !== 'plans') {
      ensureBuildingOverlayMode();
    }
  }
);

onMounted(() => {
  loadBuilding();
  document.addEventListener('click', handleClickOutside);

  isActive.value = window.innerWidth > 640;
  window.addEventListener('resize', () => {
    isActive.value = window.innerWidth > 640;
  });
})

onUnmounted(() => {
  clearTimeout(debounceTimer);
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', () => {});
});
</script>

<template>
  <main class="tw-p-2 md:tw-pt-3 md:tw-pb-6 md:tw-px-6 tw-mx-auto">
    <header v-if="building"
            class="tw-flex tw-gap-2 tw-items-center tw-justify-between tw-z-10 tw-mb-1 md:tw-mb-4">
      <div class="max-md:tw-hidden tw-justify-center tw-bg-[#232323] tw-bg-opacity-85 tw-flex tw-items-center tw-relative tw-z-10 tw-p-3 tw-py-2 tw-rounded-lg tw-h-[52px]">
        <div v-if="showFullBreadcrumbs" class="tw-flex tw-items-center tw-justify-center">
          <div class="tw-flex tw-items-center"
               v-for="(breadcrumb, i) in breadcrumbs" :key="breadcrumb.uuid">
            <router-link
              :to="i > 0 ? {name: 'home', params: { embedUuid: embedUuid, subProjectUuid: breadcrumb.uuid }} : { name: 'home', params: { embedUuid } }"
              class="tw-inline-block tw-text-sm tw-text-secondary-white tw-px-3 tw-py-1 tw-rounded tw-border tw-transition-all tw-border-silver tw-border-opacity-0 hover:tw-border-opacity-30">
              {{ breadcrumb.label }}
            </router-link>

            <span class="tw-px-2.5 tw-py-1">
              <svg width="5" height="10" viewBox="0 0 5 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 10V0L5 5L0 10Z" fill="#595959"/>
              </svg>
            </span>
          </div>
        </div>

        <span @click.prevent="setActiveTab('3D')" class="tw-text-sm tw-text-secondary-dark tw-bg-secondary-white tw-px-3 tw-py-1 tw-rounded tw-cursor-pointer">
          {{ building?.name }}
        </span>

        <button @click.prevent="showFullBreadcrumbs = !showFullBreadcrumbs" class="tw-px-1 tw-ml-2 tw-py-1.5 tw-rounded tw-bg-white tw-bg-opacity-0 hover:tw-bg-opacity-10">
          <svg :class="[showFullBreadcrumbs ? 'tw-rotate-180' : null]" class="tw-transition-all" width="10" height="18" viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.40039 1.3999L8.31926 8.32109C8.69406 8.69597 8.69406 9.30383 8.31926 9.67871L1.40039 16.5999" stroke="#EDEDED" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <div class="tw-flex max-lg:tw-flex-grow tw-gap-2">

        <div
          class="tw-justify-center tw-bg-[#232323] tw-bg-opacity-85 tw-flex tw-items-center tw-relative tw-z-10 tw-p-3 tw-py-2 tw-rounded-lg md:tw-ml-auto tw-h-10 md:tw-h-[52px]">

          <!-- Desktop tabs -->
          <div class="max-md:tw-hidden tw-flex tw-items-center tw-gap-3" :class="[!hasFloorPlate && !hasUnits ? 'tw-hidden' : null]">
            <div class="tw-space-x-1">
              <button @click.prevent="open3DView"
                      class="tw-text-sm tw-px-3 tw-py-1 tw-rounded tw-border tw-transition-all tw-border-silver tw-border-opacity-0 hover:tw-border-opacity-30"
                      :class="[
                        hasUnits ? 'tw-cursor-pointer hover:tw-border-opacity-30' : null,
                        is3DViewActive ? 'tw-bg-secondary-white hover:tw-bg-secondary-white hover:tw-text-secondary-dark tw-text-secondary-dark' : 'tw-text-secondary-white']">
                3D view
              </button>
                <button @click.prevent="openFloorPlateView"
                        class="tw-text-sm tw-px-3 tw-py-1 tw-rounded tw-border tw-transition-all tw-border-silver tw-border-opacity-0"
                        :class="[
                        hasUnits && hasFloorPlate ? 'tw-cursor-pointer hover:tw-border-opacity-30' : 'tw-hidden',
                        isFloorPlateActive ? 'tw-bg-secondary-white hover:tw-bg-secondary-white tw-text-secondary-dark' : 'tw-text-secondary-white']">
                    Floor plate
                </button>
              <button @click.prevent="openFloorPlansView"
                      class="tw-text-sm tw-px-3 tw-py-1 tw-rounded tw-border tw-transition-all tw-border-silver tw-border-opacity-0"
                      :class="[
                        hasUnits ? 'tw-cursor-pointer hover:tw-border-opacity-30' : 'tw-hidden',
                        isFloorPlansActive ? 'tw-bg-secondary-white hover:tw-bg-secondary-white tw-text-secondary-dark' : 'tw-text-secondary-white']">
                Floor plans
              </button>
            </div>
          </div>

          <div class="tw-flex tw-gap-1 tw-items-center md:tw-hidden tw-z-50 tw-relative">
            <router-link
              :to="building.project.has_parent ? { name: 'home', params: { embedUuid, subProjectUuid: building.project.slug } } : { name: 'home', params: { embedUuid } }"
              class="tw-flex tw-items-center tw-justify-center tw-py-2 tw-rounded-lg">
              <ArrowLeft />
            </router-link>

            <div class="tw-relative" :class="[!hasFloorPlate && !hasUnits ? 'tw-hidden' : null]">
              <!-- Mobile Tabs -->
              <div
                class="lg:tw-hidden tw-fixed tw-bottom-0 tw-flex tw-right-0 tw-w-full tw-z-[9]">
                <div class="tw-bg-[#232323] tw-flex tw-bg-opacity-85 max-md:tw-overflow-x-scroll max-md:tw-items-center tw-w-full tw-relative tw-z-10 tw-px-4 tw-py-3">
                  <button v-if="hasUnits && building" class="lg:tw-hidden tw-flex tw-items-center tw-py-2 tw-px-3"
                          @click.stop="toggleFilter">
                    <FilterIcon />
                    <span class="tw-ml-2 tw-text-secondary-white">Filters</span>
                  </button>

                  <button @click.prevent="open3DView" :disabled="!hasUnits"
                          class="tw-w-fit tw-flex-grow-[1] tw-flex-shrink-0 md:tw-w-full tw-text-sm tw-px-3.5 tw-py-2 md:tw-py-1 tw-rounded tw-transition-all"
                          :class="[
                            hasUnits ? 'tw-cursor-pointer' : '',
                            is3DViewActive ? 'tw-bg-[#EEEEEE] tw-text-dark' : 'tw-text-secondary-white hover:tw-bg-[#232323] tw-bg-opacity-30'
                          ]">
                    3D view
                  </button>
                    <button @click.prevent="openFloorPlateView"
                            class="tw-w-fit tw-flex-grow-[1] tw-flex-shrink-0 md:tw-w-full tw-text-sm tw-px-3.5 tw-py-2 md:tw-py-1 tw-rounded tw-transition-all"
                            :class="[
                            !hasFloorPlate ? 'tw-hidden' : '',
                            hasUnits ? 'tw-cursor-pointer hover:tw-border-opacity-30' : '',
                            isFloorPlateActive ? 'tw-bg-[#EEEEEE] tw-text-dark' : 'tw-text-secondary-white hover:tw-bg-[#232323] tw-bg-opacity-30'
                          ]">
                        Floor plate
                    </button>
                  <button
                    @click.prevent="openFloorPlansView"
                    class="tw-w-fit tw-flex-grow-[1] tw-flex-shrink-0 md:tw-w-full tw-text-sm tw-px-3.5 tw-py-2 md:tw-py-1 tw-rounded tw-transition-all"
                    :class="[
                        !hasUnits ? 'tw-hidden' : '',
                        hasUnits ? 'tw-cursor-pointer' : '',
                        isFloorPlansActive ? 'tw-bg-[#EEEEEE] tw-text-dark' : 'tw-text-secondary-white hover:tw-bg-[#232323] tw-bg-opacity-30'
                      ]"
                  >
                    Floor plans
                  </button>
                </div>
              </div>
              <!-- /Mobile Tabs -->
            </div>
          </div>
        </div>

        <SiteSettings :class="{'max-lg:tw-right-[50px]': hasNightImages && activeTab === '3D' }" />

        <!-- Day/Night Toggle -->
        <DayNightToggle
          class="!tw-top-[8px] md:!tw-top-3 max-md:tw-right-2.5 lg:!tw-top-[74px]"
          v-if="activeTab === '3D' && building"
          v-model="viewMode"
          :has-night-images="building.images_night && building.images_night.length > 0"
        />
      </div>
    </header>

    <div class="tw-relative tw-flex tw-items-start tw-gap-2">

      <!-- Filter -->
      <FilterCard
        v-if="hasUnits && building"
        :activeTab="activeTab"
        @close="showFilter = false"
        :is-open="showFilter"
        :building="building"
        :hasImage="activeTab === 'plate'"
      />

      <!-- Plate floor navigator -->
      <div
        v-if="activeTab === 'plate' && groupedPlateFloors.length"
        :class="{'tw-w-full max-sm:tw-left-0 sm:tw-w-[176px] max-sm:tw-bottom-0 max-md:tw-bottom-[76px] tw-bg-[#232323] tw-bg-opacity-85 tw-p-3': isActive, 'max-md:tw-bottom-[76px]': !isActive}"
        class="tw-shrink-0 tw-z-10 tw-rounded-xl max-md:tw-fixed"
      >
        <!-- Responsive container-->
        <div>
          <div class="tw-flex tw-items-center">
            <template v-if="isActive">
              <span class="tw-text-sm tw-text-secondary-white tw-uppercase">Floor:</span>
              <span class="tw-text-sm tw-ml-2 tw-font-semibold tw-text-yellow">{{ activePlateFloor }}</span>

              <button class="tw-ml-auto" @click.stop="isActive = !isActive">
                <svg class="tw-w-4 tw-h-4" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.7 0.5L0.5 15.7" stroke="#EDEDED" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M0.5 0.5L15.7 15.7" stroke="#EDEDED" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </template>

            <button
              :class="{'tw-bg-[#232323] tw-bg-opacity-85 tw-p-3 tw-rounded-xl': !isActive}"
              class="tw-flex tw-text-secondary-white tw-items-center tw-gap-3"
              v-else
              @click.stop="isActive = !isActive"
            >
              <svg width="19" height="17" viewBox="0 0 19 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.5 11.5C0.5 11.7108 0.608842 11.9215 0.826485 12.0403L8.55092 16.2587C9.14007 16.5804 9.86044 16.5804 10.4495 16.2587L18.1735 12.0403C18.3911 11.9215 18.5 11.7108 18.5 11.5" stroke="#EDEDED" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M0.5 8.5C0.5 8.71077 0.608842 8.92153 0.826485 9.0403L8.55092 13.2587C9.14007 13.5804 9.86044 13.5804 10.4495 13.2587L18.1735 9.0403C18.3911 8.92153 18.5 8.71077 18.5 8.5" stroke="#EDEDED" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.1734 4.95952L10.4495 0.741307C9.86041 0.419613 9.14009 0.419579 8.55095 0.741119L0.826523 4.95952C0.391159 5.1973 0.391159 5.80274 0.826523 6.04051L8.55095 10.2587C9.14009 10.5804 9.86041 10.5804 10.4495 10.2587L18.1734 6.04051C18.6089 5.80274 18.6089 5.1973 18.1734 4.95952Z" stroke="#EDEDED" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Floor plates
            </button>
          </div>

          <div class="tw-mt-2 tw-space-y-5" :class="{'tw-hidden': !isActive}">
            <div>
              <input
                v-model="floorInput"
                @input="handleFloorInput"
                type="text"
                @keypress="onlyNumbers"
                placeholder="Enter or select a floor"
                class="placeholder:tw-text-secondary-white tw-border tw-border-[#F8F8F852] tw-border-opacity-30 tw-text-xs tw-text-secondary-white tw-mb-3 tw-p-2 tw-outline-none tw-w-full tw-bg-transparent tw-rounded"
              />

              <div class="tw-flex tw-items-center tw-justify-between mt-4">
                <span class="tw-text-yellow tw-text-xs">Only available</span>

                <div
                  @click="onlyAvailable = !onlyAvailable"
                  class="tw-w-11 tw-h-5 tw-rounded-full tw-cursor-pointer tw-relative tw-transition-colors tw-duration-200"
                  :class="onlyAvailable ? 'tw-bg-yellow' : 'tw-bg-[#555]'"
                >
                  <div
                    class="tw-absolute tw-top-[2px] tw-left-[2px] tw-w-[16px] tw-h-[16px] tw-bg-white tw-rounded-full tw-shadow tw-transition-transform tw-duration-200"
                    :class="onlyAvailable ? 'tw-translate-x-[23px]' : 'tw-translate-x-0'"
                  />
                </div>
              </div>
            </div>

            <div class="tw-max-h-[296px] tw-overflow-y-auto tw-pr-1">
              <template v-for="(group, groupIdx) in groupedPlateFloors" :key="group.key">
                <div>
                  <div class="tw-space-y-2">
                    <div class="tw-grid tw-grid-cols-4 tw-gap-2 tw-items-center">
                      <div class="max-sm:tw-text-left tw-col-span-4 sm:tw-col-span-2 tw-text-xs tw-text-center" style="color: rgba(239, 239, 239, .8);">
                        {{ group.rangeLabel }}
                      </div>

                      <button
                        v-for="floor in (onlyAvailable ? group.floors.filter(f => f.exists) : group.floors)"
                        :key="floor.number"
                        :disabled="!floor.exists"
                        @click="selectPlateFloor(floor.number)"
                        class="tw-w-[52px] sm:tw-w-8 tw-h-11 sm:tw-h-6 tw-rounded-[4px] tw-text-xs tw-border tw-transition-all"
                        :class="{
                      'tw-bg-white tw-border-white': activePlateFloor === floor.number,
                      'tw-opacity-30 tw-cursor-not-allowed': !floor.exists,
                    }"
                        :style="getFloorButtonStyle(floor)"
                      >
                        {{ floor.number }}
                      </button>
                    </div>
                  </div>

                  <div
                    v-if="groupIdx < groupedPlateFloors.length - 1"
                    class="tw-py-3"
                  >
                    <hr style="border-color: rgba(248, 248, 248, 0.32);" />
                  </div>
                </div>
              </template>
            </div>

            <button
              @click="isActive = !isActive"
              class="tw-w-full tw-mt-6 md:tw-hidden tw-text-secondary-dark tw-bg-secondary-white tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-text-center"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <template v-if="activeTab === '3D' && building && units">
        <BuildingView
          ref="buildingViewRef"
          @open-gallery="(i) => openCarrousel(i)"
          @open-unit-gallery="(image) => openUnitPlanCarrousel(image)"
          @open-iframe-gallery="(link) => openCarrousel(link)"
          @open-payment-plan="(id) => openPaymentPlan(id)"
          @open-amenity-gallery="(i) => openAmenity(i)"
          @open-floor-plate="handleOpenFloorPlate"
          :building="building"
          :units="units"
          :view-mode="viewMode"
          :floor-unit-stats="floorUnitStats"
          @open-unit-drawer="openUnitDrawer"
        />
      </template>

      <template v-if="activeTab === 'plans' && building && hasUnitPlans">
        <PlansView
          :building="building"
          @open-unit-drawer="openUnitDrawer"
        />
      </template>

      <template v-if="activeTab === 'plate' && building && hasUnits">
        <div class="tw-w-full">
          <Suspense>
            <PlateView
              :building="building"
              :units="units"
              :selected-floor="selectedFloor"
              :reverse-transition-video-src="reverseTransitionVideoSrc"
              @floor-change="selectPlateFloor"
              @open-unit-drawer="openUnitDrawer"
              @return-to-building="openFloorPlateView"
            />
            <template #fallback>
              <PlateSceleton />
            </template>
          </Suspense>
        </div>
      </template>
    </div>

    <ApartmentView ref="unitDrawer" :building="building" :view-mode="viewMode" />

    <ExchangeDisclaimer
      v-if="building?.units[0]?.real_price_currency_code"
      :currency="building?.units[0]?.real_price_currency_code"
      :activeTab="activeTab"
    />

    <InfoWidget v-if="activeTab === '3D' && building" :project="building" />

    <OptionsWidget
      @open-gallery="(i) => openCarrousel(i)"
      @open-amenity-gallery="(i) => openAmenity(i)"
      @open-video-gallery="(i) => openVideoCarrousel(i)"
      v-if="building && activeTab === '3D'"
      :project="building"
    />

    <GalleryCarousel :iframeLink="threeSixtyLink" ref="gallery" />

    <GalleryCarousel
      v-if="unitPlanImage"
      :images="[{filename: unitPlanImage}]"
      ref="unitPlansGallery"
    />

    <GalleryCarousel :images="amenityImage" ref="amenityGallery" />

    <PaymentPlan ref="paymentPlanRef" />

    <VideoCarousel
      :video-link="videoLink"
      :thumbnail-list="building?.video_links"
      ref="videoGallery"
    />

      <div v-if="isTransitioning" class="video-overlay" :class="{ 'fade-out': videoFading }">
          <video
              ref="transitionVideo"
              :src="transitionVideoSrc"
              muted
              playsinline
              @canplay="videoReady = true"
              @ended="onVideoEnded"
              :style="{ opacity: videoReady ? 1 : 0 }"
          />
      </div>
  </main>
</template>

<style>
.video-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: transparent;
    transition: opacity 1s ease;
}

.video-overlay.fade-out {
    opacity: 0;
    pointer-events: none;
}

.video-overlay video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0;
    transition: opacity 0.2s ease;
}
</style>
