<script setup>
import {nextTick, ref, watch, computed, onBeforeUnmount, onMounted} from "vue";
import { useFilterStore } from "@/stores/filterStore";
import { useRoute, useRouter } from "vue-router";
import ProjectService from "@/api/services/Project";
import { snakeCaseToTitleCase } from "../utils";
import svgParser from "../svgParser";
import ImageCanvas from "../ImageCanvas.vue";
import InlineSvg from "../InlineSvg.vue";
import DayNightToggle from "../DayNightToggle.vue";
import { useMapAnimationStore } from "@/stores/mapAnimationStore";
import { useViewModeStore } from "@/stores/viewModeStore";
import { storeToRefs } from "pinia";
import { buildViewsFromImages } from "../viewTransformer";
import {useSettingsStore} from "@/stores/settingsStore.js";

const settings = useSettingsStore();

const hasCurrencies = computed(() => settings.getAvailableCurrencies.length > 1);
const hasMeasurements = computed(() => settings.getAvailableMeasurements.length > 1);

const topClass = computed(() =>
  hasCurrencies.value || hasMeasurements.value
    ? 'md:tw-top-[62px] lg:tw-top-[74px]'
    : 'md:tw-top-[12px]'
);

const route = useRoute();
const embedUuid = route.params.embedUuid;
const filterStore = useFilterStore();
const router = useRouter();
const filteredIds = ref();
const { complex } = defineProps(["complex"]);
const emit = defineEmits(["open-project-info", "open-gallery", "open-amenity-gallery", "current-media360"]);
const swipeResizeObserver = ref(null);

// map animation state
const mapAnimationStore = useMapAnimationStore();
const { getProjectState, getCanvasState } = storeToRefs(mapAnimationStore)

// view mode state
const viewModeStore = useViewModeStore();
const viewMode = computed({
  get: () => viewModeStore.viewMode,
  set: (value) => viewModeStore.setViewMode(value)
});

// Tooltip Helpers
import {
  isTooltipBottom,
  getTooltipYClasses,
  getTooltipXClasses
} from '@/helpers/tooltipHelpers'

// DOM Refs
const svgMapUnitIdToPath = ref({});
const currentlyHighlightedIds = ref([]);
const svgContainer = ref(null);
const childrenMap = ref({});
const svgMapUnitIdToTitle = ref({});
const activeViewIdx = ref(0);
const isLoading = ref(true);
const animationInProgress = ref(false);
const threeSixtyPins = ref();
const amenityPins = ref();
const video = ref();
const titlePins = ref([])
// const videoPoster = ref();
const videoPlayer = ref();
const canvas = ref(null);
const prevImagesLoaded = ref(false);
const nextImagesLoaded = ref(false);

const currentViews = computed(() => buildViewsFromImages(viewMode.value === 'day' ? complex.images : (complex.images_night || [])));
const hasNightImages = computed(() => complex.images_night && complex.images_night.length > 0);
const currentView = computed(() => currentViews.value[activeViewIdx.value]?.view);
const currentViewImage = computed(() => currentViews.value[activeViewIdx.value]?.image);

const getProjectKey = computed(() => {
  let key =  embedUuid;
  const sub = route.params.subProjectUuid
  if(sub) {
    key += `-${sub}`;
  }
  return key;
});

const getCurrentViewOrientation = () => {
  return currentView.value?.orientation;
};

const findViewIndexByOrientation = (orientation) => {
    if (!orientation) return -1;
  return currentViews.value.findIndex(view =>
    view?.view?.orientation === orientation
    );
};

const saveProjectState = () => {
  const projectKey = getProjectKey.value;
  const orientation = getCurrentViewOrientation();
  mapAnimationStore.addProjectState(projectKey, {
    currentViewOrientation: orientation,
  });
};

const restoreProjectState = () => {
  const projectKey = getProjectKey.value;
  // Canvas frame is the authoritative restored visual state.
  // Prefer it so SVG overlay and labels match what is rendered on canvas.
    const savedCanvasState = getCanvasState.value(projectKey);
    if (
      savedCanvasState?.currentViewIndex !== undefined &&
      savedCanvasState.currentViewIndex >= 0 &&
      savedCanvasState.currentViewIndex < currentViews.value.length
    ) {
      activeViewIdx.value = savedCanvasState.currentViewIndex;
      return true;
    }

    const savedState = getProjectState.value(projectKey);

    if (savedState?.currentViewOrientation) {
      const idx = findViewIndexByOrientation(savedState.currentViewOrientation);
      if (idx !== -1) {
        activeViewIdx.value = idx;
        return true;
      }
    }
    return false;
};

const openModal = (building) => {
  emit("open-project-info", building);
};

const openGallery = (i) => {
  emit("open-gallery", i);
};

const openAmenityGallery = (i) => {
  emit("open-amenity-gallery", i);
};

filterStore.$subscribe(() => {
  filter();
});

const animationFinished = async (index) => {
  activeViewIdx.value = index;
  animationInProgress.value = false;
  isLoading.value = false;

  await loadNewSvgContent();

  const viewImage = currentViewImage.value;
  getVideo(viewImage);
  getAmenityPins(viewImage);
  getThreeSixtyPins(viewImage);
  getTitlePins(viewImage);

  // Save state after animation completes
  saveProjectState();
};

const animate = (direction) => {
  if (animationInProgress.value) {
    return;
  }

  prevImagesLoaded.value = false;
  nextImagesLoaded.value = false;
  animationInProgress.value = true;
  video.value = null;
  // videoPoster.value = null;
  amenityPins.value = [];
  threeSixtyPins.value = [];
  titlePins.value = [];

  if (canvas.value) {
    direction === -1 ? canvas.value.prev(animationFinished) : canvas.value.next(animationFinished);
  }
};

const navigateTo = (uuid) => {
  if (!uuid)  return;
  if(!prevImagesLoaded.value || !nextImagesLoaded.value) return;

  const slug = childrenMap.value[uuid].slug;
  router.push(
    complex.child_projects.length > 0
      ? {
        name: "home",
        params: { embedUuid: embedUuid, subProjectUuid: slug },
      }
      : {
        name: "show-building",
        params: { embedUuid: embedUuid, buildingUuid: slug },
      }
  );
};

const handlePathClick = (event) => {
  navigateTo(event.target.getAttribute("data-id"));
};

const loadNewSvgContent = async () => {
  // wait for dom to load svg
  await nextTick(() => {
    // parse svg
    parseSvg();

    // Since the whole svg changed, we don't care what was highlighted before
    currentlyHighlightedIds.value = [];

    // Highlight everything at first
    highlightPathsByIds(Object.keys(svgMapUnitIdToPath.value));

    // If filtered values exist, overwrite just them
    if (filteredIds.value) highlightPathsByIds(filteredIds.value);

  });
};

const setupResizeObserver = () => {
  if (!svgContainer.value) return;

  swipeResizeObserver.value = new ResizeObserver(() => {
  });

  swipeResizeObserver.value.observe(svgContainer.value);
};

// Clean up the resize observer when component is unmounted
onBeforeUnmount(() => {
  if (swipeResizeObserver.value) {
    swipeResizeObserver.value.disconnect();
  }
});

watch(svgContainer, (newValue) => {
  if (newValue) {
    setupResizeObserver();
  }
}, { immediate: true });

const parseSvg = async () => {
  if (!svgContainer.value) return;
  svgMapUnitIdToPath.value = svgParser(svgContainer.value);

  if (!svgContainer.value.children[0]) return;
  svgContainer.value.children[0].setAttribute("preserveAspectRatio", "xMidYMid slice");
  // Make the shapes visible outside the SVG container.
  // This is for smaller screen where the SVG is not fully visible.
  svgContainer.value.children[0].style.overflow = "visible";
};

// Because panzoom changes the zoom/size of the container,
// we need to take that into account when drawing the labels.
const zoomLevelApplied = ref(1);
const onZoom = (zoomLevel) => {
  zoomLevelApplied.value = zoomLevel;
};


const filter = () => {
  if (complex.child_projects.length > 0) return;

  new ProjectService().filter(embedUuid, filterStore.getFilters, route.params.subProjectUuid).then((res) => {
    filteredIds.value = res.data;
    const filteredByPrice = filterStore.filterComplexBuildingsByPriceRange(complex)
    filteredIds.value = filteredIds.value.filter(uuid => filteredByPrice.includes(uuid))
    highlightPathsByIds(filteredIds.value);
  });
};

const highlightPathsByIds = (idList) => {
  // Reset all <path> to have no style
  currentlyHighlightedIds.value.forEach((k) => {
    svgMapUnitIdToPath.value[k]?.classList.add(
      "!tw-fill-[#ffffff00]",
      "hover:!tw-fill-[#ffffff3d]",
      "tw-cursor-pointer"
    );
    svgMapUnitIdToPath.value[k]?.classList.remove(
      "!tw-fill-[#ffffff00]",
      "hover:!tw-fill-[#ffffff3d]",
    );
  });

  currentlyHighlightedIds.value = idList;

  // Highlight all passed in ids
  idList.forEach(highlightPathById);
};

const highlightPathById = (id) => {
  svgMapUnitIdToPath.value[id]?.classList.remove("!tw-fill-[#E5E5E50A]", "hover:!tw-fill-[#E5E5E529]");

  // Highlight sub-complexes (where .units === undefined) or buildings with available units
  if (childrenMap.value[id] && (childrenMap.value[id].units?.length > 0 || childrenMap.value[id].units === undefined)) {
    complex.child_projects.length > 0
      ? svgMapUnitIdToPath.value[id]?.classList.add(
        "tw-stroke-white",
        "tw-stroke-[0.7]",
        "!tw-fill-[#E5E5E50A]",
        "hover:!tw-fill-[#E5E5E529]",
        "tw-cursor-pointer"
      )
      : svgMapUnitIdToPath.value[id]?.classList.add(
          "tw-stroke-white",
          "tw-stroke-[0.7]",
          "tw-transition",
          "!tw-fill-[#FFFFFF1F]",
          "hover:!tw-fill-[#FFFFFF3D]",
          "tw-cursor-pointer"
        );
  } else if (childrenMap.value[id]) {
    svgMapUnitIdToPath.value[id]?.classList.add(
      "!tw-fill-[#E5E5E50A]",
      "hover:!tw-fill-[#E5E5E529]",
      "tw-cursor-pointer"
    );
  }

  if (childrenMap.value[id]) {
    svgMapUnitIdToPath.value[id]?.addEventListener("click", handlePathClick);
  }
};

const handleImageLoad = () => {
  isLoading.value = false;
};

const getVideo = (image) => {
  if (!image || !image.views || !image.views.length) {
    video.value = null;
    return;
  }
  video.value = image.views[0]?.video_filename;
  // videoPoster.value = image.filename;
  nextTick(() => videoPlayer.value?.load());
};

const getThreeSixtyPins = (image) => {
  if (!image || !image.media360) {
      threeSixtyPins.value = [];
      return;
  }

  threeSixtyPins.value = image.media360;
  emit("current-media360", image.media360);
};

const getAmenityPins = (image) => {
    if (!image || !image.mapped_amenity) {
        amenityPins.value = [];
        return;
    }

    amenityPins.value = image.mapped_amenity;
};

const getTitlePins = (image) => {
    if (!image || !image.views[0]?.mapped_title_positions) {
        titlePins.value = [];
        return;
    }

    titlePins.value = { ...image.views[0]?.mapped_title_positions };
};

const svgDataIdCount = ref(0);

const updateSvgCount = async () => {
  await nextTick();
  const svgDataIds = [...document.querySelectorAll('svg [data-id]')]
    .map(el => el.getAttribute('data-id'));

  const buildingUuids = (complex?.buildings ?? []).map(b => b.uuid);

  const matchingCount = buildingUuids.filter(uuid => svgDataIds.includes(uuid)).length;

  svgDataIdCount.value = matchingCount;
  emit('svgCount', matchingCount);
};
const onCanvasStateRestored = (payload) => {
  const canvasViewIndex = payload?.currentViewIndex;

  if (
    canvasViewIndex !== undefined &&
    canvasViewIndex >= 0 &&
    canvasViewIndex < currentViews.value.length &&
    canvasViewIndex !== activeViewIdx.value
  ) {
    activeViewIdx.value = canvasViewIndex;

    nextTick(async () => {
      await loadNewSvgContent();
      const viewImage = currentViewImage.value;
      getVideo(viewImage);
      getThreeSixtyPins(viewImage);
      getAmenityPins(viewImage);
      getTitlePins(viewImage);
    });
  }
};

watch(
  () => complex,
  async () => {
    // Try to restore previous state, otherwise reset to first image with view
    if (!restoreProjectState()) {
      activeViewIdx.value = currentViews.value.length > 0 ? 0 : 0;
    }

    // This is needed for svg parsing
    (complex?.buildings ?? []).forEach((project) => {
      childrenMap.value[project.uuid] = project;
    });
    (complex?.child_projects ?? []).forEach((project) => {
      childrenMap.value[project.uuid] = project;
    });

    // Remove filtered ids
    filteredIds.value = undefined;

    await loadNewSvgContent();

    const viewImage = currentViewImage.value;
    getVideo(viewImage);
    getThreeSixtyPins(viewImage);
    getAmenityPins(viewImage);
    getTitlePins(viewImage);
    await updateSvgCount();
  },
  { immediate: true }
);

// Watch for view mode changes
watch(viewMode, async () => {
  // Get the orientation from saved state
  const savedState = getProjectState.value(getProjectKey.value);
  const previousOrientation = savedState?.currentViewOrientation;

  // Try to find the same view orientation in the new mode
  let targetIdx = findViewIndexByOrientation(previousOrientation);

  // Fallback: first image that has a view
  if (targetIdx === -1) {
    targetIdx = currentViews.value.length > 0 ? 0 : 0;
  }

  activeViewIdx.value = targetIdx;

  prevImagesLoaded.value = false;
  nextImagesLoaded.value = false;
  animationInProgress.value = false;

  await loadNewSvgContent();

  const viewImage = currentViewImage.value;
  getVideo(viewImage);
  getThreeSixtyPins(viewImage);
  getAmenityPins(viewImage);
  getTitlePins(viewImage)
});

const initialize = () => {
  const viewImage = currentViewImage.value;
  if (!viewImage) return;

  getVideo(viewImage);
  getThreeSixtyPins(viewImage);
  getAmenityPins(viewImage);
  getTitlePins(viewImage)
  handleImageLoad();
};

watch(currentViews, () => {
  prevImagesLoaded.value = false;
  nextImagesLoaded.value = false;
  animationInProgress.value = false;

  initialize();
}, { immediate: true });

const getAvailableUnitsCount = (uuid) => {
  const building = childrenMap.value[uuid];

  if (!building || !building.units) return 0;
  return building.units.filter(unit => unit.status === 'available').length;
};

</script>

<template>
  <div v-if="(complex?.images ?? []).length > 0" ref="animationContainer" class="tw-fixed tw-inset-0">
    <ImageCanvas
      ref="canvas"
      :src-key="getProjectKey"
      :views="currentViews"
      @on-zoom="onZoom"
      @canvasStateRestored="onCanvasStateRestored"
      @animatePrev="() => animate(-1)"
      @animateNext="() => animate(1)"
      @previousImagesLoaded="(val) => (prevImagesLoaded = val)"
      @nextImagesLoaded="(val) => (nextImagesLoaded = val)"
    >
      <template #overlay>
        <video
          ref="videoPlayer"
          v-show="video !== null"
          :src="video"
          autoplay
          loop
          muted
          playsinline
          type="video/mp4"
          class="tw-absolute tw-object-cover tw-top-0 tw-left-0 tw-w-full tw-h-full"
        >
<!--          <source :src="video" type="video/mp4" media="(min-width: 640px)" />-->
        </video>

        <!-- Labels above path -->
        <template v-if="!animationInProgress">
          <div
            v-for="(data, id) in titlePins"
            :key="id"
            :style="{ top: `${data.y}%`, left: `${data.x}%` }"
            @click="() => navigateTo(data.uuid)"
            class="tw-absolute tw-z-20"
            :class="`titlePin-${id}`"
          >
            <div
              :class="viewMode === 'day' ? 'tw-bg-[#232323]' : 'tw-bg-white !tw-text-dark'"
              class="tw-w-fit tw-mx-auto hover:tw-scale-[1.1] hover:tw-border-opacity-50 tw-transition-all tw-pointer-events-auto tw-py-2 tw-px-4 tw-bg-[#232323] tw-flex tw-items-center tw-gap-1 tw-bg-opacity-85 tw-rounded-full tw-border tw-border-white tw-border-opacity-20 tw-text-white tw-text-xs tw-text-center tw-font-semibold tw-z-20 tw-cursor-pointer">
              <p class="tw-font-semibold" :class="[complex.has_parent ? 'tw-text-sm' : null]">
                {{ data.title }}
              </p>
            </div>

            <div v-if="getAvailableUnitsCount(data.uuid) > 0"
                 class="tw-mt-2 tw-mx-auto tw-w-fit tw-pointer-events-auto tw-py-1 tw-px-2 tw-bg-[#232323] tw-flex tw-items-center tw-gap-1 tw-bg-opacity-50 tw-rounded-full tw-text-white tw-text-center tw-z-20 tw-cursor-pointer">
              <p class="tw-text-xs">
                Available units: <span class="tw:font-semibold">{{ getAvailableUnitsCount(data.uuid) }}</span>
              </p>
            </div>
        </div>
        </template>

        <div
          v-show="currentView && !animationInProgress"
          :class="{ 'tw-opacity-0': isLoading || animationInProgress }"
          @click="handlePathClick"
          class="tw-absolute tw-top-0 tw-left-0 tw-w-full tw-h-full tw-flex tw-justify-center tw-items-center [&>svg]:tw-w-full [&>svg]:tw-h-full tw-pointer-events-none"
          ref="svgContainer"
          v-html="currentView?.svg_overlay"
        ></div>

        <template v-if="threeSixtyPins">
          <div
            v-for="(threeSixtyPin, i) in threeSixtyPins"
            :key="i"
            class="tw-absolute tw-group"
            :style="{ left: `${threeSixtyPin.x}%`, top: `${threeSixtyPin.y}%` }"
          >
            <button
              @click="openGallery(threeSixtyPin.link)"
              class="map-360-button"
            >
              <InlineSvg icon="360" />
            </button>
            <div
              class="tw-absolute max-md:tw-hidden tw-z-[9] tw-opacity-0 group-hover:tw-opacity-100 tw-transition tw-pointer-events-none group-hover:tw-pointer-events-auto"
              :class="[
                getTooltipYClasses(threeSixtyPin.y),
                getTooltipXClasses(threeSixtyPin.x)
              ]"
            >
            <span v-if="isTooltipBottom(threeSixtyPin.y)"
                  class="tw-bg-white tw-mb-1 tw-text-dark tw-w-fit tw-mx-auto tw-py-1 tw-px-2 tw-flex tw-items-center tw-rounded-full tw-text-xs tw-text-center tw-font-medium">
              {{ threeSixtyPin.name }}
            </span>

              <figure @click="openGallery(threeSixtyPin.link)" class="tw-cursor-pointer tw-mb-1 tw-w-[180px] tw-h-[100px] tw-rounded tw-overflow-hidden tw-bg-white tw-p-1">
                <img :src="threeSixtyPin.image" class="tw-w-full tw-h-full tw-object-cover tw-rounded" :alt="threeSixtyPin.name">
              </figure>

              <span v-if="!isTooltipBottom(threeSixtyPin.y)"
                    class="tw-bg-white tw-text-dark tw-w-fit tw-mx-auto tw-py-1 tw-px-2 tw-flex tw-items-center tw-rounded-full tw-text-xs tw-text-center tw-font-medium">
    {{ threeSixtyPin.name }}
  </span>
            </div>
          </div>
        </template>

        <template v-if="amenityPins">
          <div
            v-for="(amenityPin, i) in amenityPins"
            :key="i"
            class="tw-absolute"
            :style="{ left: `${amenityPin.x}%`, top: `${amenityPin.y}%` }"
          >
            <button
              @click="openAmenityGallery(amenityPin.inventory_amenity.images)"
              class="map-amenity-button tw-peer tw-w-6 tw-h-6"
            >
              <InlineSvg icon="amenity" />
            </button>

            <span
              class="max-md:tw-hidden peer-hover:tw-opacity-100 tw-relative -tw-top-9 tw-left-4 tw-opacity-0 tw-transition tw-bg-dark tw-bg-opacity-85 tw-text-yellow tw-w-fit tw-mx-auto tw-py-1 tw-px-2 tw-flex tw-items-center tw-rounded-full tw-text-xs tw-text-center tw-font-medium tw-z-20">
                {{ amenityPin.name }}
            </span>
          </div>
        </template>
      </template>
    </ImageCanvas>

    <!-- Day/Night Mode Toggle (hidden on mobile, shown in header) -->
    <DayNightToggle
      v-model="viewMode"
      :has-night-images="hasNightImages"
      class="tw-top-[8px] max-md:tw-right-[12px]"
      :class="topClass"
    />

    <!-- Map Rotation widget -->
    <div
      v-if="currentViews.length > 1"
      class="tw-fixed tw-z-50 tw-max-w-max tw-w-full tw-text-white tw-flex tw-items-center tw-justify-between tw-gap-3 tw-left-0 tw-right-0 md:tw-bottom-6 tw-mx-auto tw-rounded-xl tw-p-3 tw-bg-[#232323] tw-bg-opacity-70"
      :class="svgDataIdCount > 1 ? 'tw-bottom-[76px]' : 'tw-bottom-3'"
    >
      <button
        @click="animate(-1)"
        :disabled="animationInProgress || !prevImagesLoaded"
        :class="animationInProgress || !prevImagesLoaded ? 'tw-cursor-wait tw-opacity-30' : ''"
        class="tw-bg-white tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10"
      >
        <InlineSvg icon="arrow" />
      </button>

      <div class="tw-flex tw-flex-col tw-justify-between tw-items-center">
        <span class="tw-font-semibold">View</span>
        <span class="tw-text-sm tw-text-yellow tw-h-5">{{
          snakeCaseToTitleCase(currentView?.orientation)
        }}</span>
      </div>

      <button
        @click="animate(1)"
        :disabled="animationInProgress || !nextImagesLoaded"
        :class="animationInProgress || !nextImagesLoaded ? 'tw-cursor-wait tw-opacity-30' : ''"
        class="tw-bg-white tw-rounded-lg tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10"
      >
        <InlineSvg icon="arrow" class="tw-rotate-180" />
      </button>
    </div>
  </div>
</template>
