<script setup>
// Vue & External
import {computed, nextTick, onBeforeMount, onBeforeUnmount, onMounted, provide, ref, watch} from "vue";
import {useRoute} from "vue-router";

// Store
import {useFilterStore} from "@/stores/filterStore";

// Components
import UnitMapCard from "@/components/building/UnitMapCard.vue";
import UnderConstruction from "@/components/modals/UnderConstruction.vue";

// Services & Utils
import BuildingService from "@/api/services/Building";
import {getQueryParamBoolean, isMobile, saveDataConnection, snakeCaseToTitleCase} from "../utils";
import bedroomColors from "../bedroomColors";
import childPositioning from "../childPositioning";
import svgParser from "../svgParser";
import ImageCanvas from "../ImageCanvas.vue";
import InlineSvg from "../InlineSvg.vue";
import { useMapAnimationStore } from "@/stores/mapAnimationStore";
import { storeToRefs } from "pinia";
import { buildViewsFromImages } from "../viewTransformer";

// Tooltip Helpers
import {
  isTooltipBottom,
  getTooltipYClasses,
  getTooltipXClasses
} from '@/helpers/tooltipHelpers'

const sequence = ref(null);
const canvas = ref(null);

const emit = defineEmits([
  "open-gallery",
  "open-amenity-gallery",
  "openUnitDrawer",
  "current-media360",
  "open-iframe",
  "open-unit-gallery",
  "open-iframe-gallery",
  "open-payment-plan",
  "open-floor-plate", // NEW: Navigate to floor plate view
]);
const route = useRoute();
const filterStore = useFilterStore();
const embedUuid = route.params.embedUuid;
const buildingUuid = route.params.buildingUuid;
const { building, units, viewMode = 'day', floorUnitStats = {} } = defineProps(["building", "units", "viewMode", "floorUnitStats"]);

// DOM Refs
const svgMapUnitIdToPath = ref({});
const currentlyHighlightedIds = ref([]);

const svgContainer = ref(null);
const svgContainerRect = computed(() => svgContainer.value?.getBoundingClientRect());
const animationContainer = ref();
const activeViewIdx = ref(0);
const unitMapCardWrap = ref();
const unitHoverCardWrap = ref();
const unitMapCard = ref();
const hoveredUnit = ref();
const filteredIds = ref();
const filteredFloorNumbers = ref(null);
const swipeContainer = ref();
const isLoading = ref(true);
const animationInProgress = ref(false);
const threeSixtyPins = ref();
const amenityPins = ref();
const video = ref();
// const videoPoster = ref();
const videoPlayer = ref();
const swipeResizeObserver = ref(null);

const prevImagesLoaded = ref(false);
const nextImagesLoaded = ref(false);

// map animation state
const mapAnimationStore = useMapAnimationStore();
const { getProjectState } = storeToRefs(mapAnimationStore)

const currentViews = computed(() => buildViewsFromImages(viewMode === 'day' ? building.images : (building.images_night || [])));

const getBuildingKey = computed(() => {
    return `building-${embedUuid}-${buildingUuid}`;
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

const saveBuildingState = () => {
    const projectKey = getBuildingKey.value;
    const orientation = getCurrentViewOrientation();
    mapAnimationStore.addProjectState(projectKey, {
        currentViewOrientation: orientation,
    });
};

const restoreBuildingState = () => {
    const key = getBuildingKey.value;
    const savedState = getProjectState.value(key);

    if (savedState?.currentViewOrientation) {
      const idx = findViewIndexByOrientation(savedState.currentViewOrientation);
      if (idx !== -1) {
        activeViewIdx.value = idx;
        return true;
      }
    }
    return false;
};

// Function to center the scrollable content horizontally
const centerScrollContent = () => {
  if (!swipeContainer.value) return;

  const container = swipeContainer.value;
  const scrollWidth = container.scrollWidth;
  const clientWidth = container.clientWidth;

  // Check if there's a horizontal scrollbar
  if (scrollWidth > clientWidth) {
    // Calculate the center position and set scrollLeft
    container.scrollLeft = (scrollWidth - clientWidth) / 2;
  }
};

filterStore.$subscribe(() => {
  filter();
});

const currentView = computed(() => currentViews.value[activeViewIdx.value]?.view);
const currentViewImage = computed(() => currentViews.value[activeViewIdx.value]?.image);
const animationFinished = async (index) => {
  activeViewIdx.value = index;
  animationInProgress.value = false;
  isLoading.value = false;

  await loadNewSvgContent();

  const viewImage = currentViewImage.value;
  getVideo(viewImage);
  getAmenityPins(viewImage?.mapped_amenity);
  getThreeSixtyPins(viewImage?.media360);

  saveBuildingState();
};

const animate = (direction) => {
  if (animationInProgress.value) {
    return;
  }

  animationInProgress.value = true;
  amenityPins.value = [];
  threeSixtyPins.value = [];
  prevImagesLoaded.value = false;
  nextImagesLoaded.value = false;

  video.value = null;

  // videoPoster.value = null;

  unitMapCard.value.close();

  if (canvas.value) direction === -1 ? canvas.value.prev(animationFinished) : canvas.value.next(animationFinished);
  if (sequence.value) sequence.value.play(30);
};

const filter = () => {
  if (!building.units || building.units.length === 0) return;

  const filters = filterStore.getFilters;

  if (overlayMode.value === 'elevation') {
    new BuildingService()
      .filterFloors(embedUuid, buildingUuid, filters)
      .then((res) => {
        const floorsFromApi = Array.isArray(res?.data)
          ? res.data.map((floor) => Number.parseInt(floor, 10)).filter((floor) => !Number.isNaN(floor))
          : [];

        const filteredByPrice = filterStore.filterBuildingUnitsByPriceRange(building);
        const floorsFromPriceFilter = [...new Set(
          filteredByPrice
            .map((uuid) => Number.parseInt(units?.[uuid]?.floor, 10))
            .filter((floor) => !Number.isNaN(floor))
        )];

        filteredFloorNumbers.value = floorsFromApi.filter((floor) => floorsFromPriceFilter.includes(floor));
        parseElevationSvg();
      })
      .catch(() => {});

    return;
  }

  new BuildingService()
    .filter(embedUuid, buildingUuid, filters)
    .then((res) => {
      filteredIds.value = Array.isArray(res.data) ? res.data : [];
      const filteredByPrice = filterStore.filterBuildingUnitsByPriceRange(building)
      filteredIds.value = filteredIds.value.filter(uuid => filteredByPrice.includes(uuid))
      highlightPathsByIds(filteredIds.value);
      filteredFloorNumbers.value = null;
    })
    .catch(() => {
      // Keep units visible if filtering fails (e.g. transient 400/timeout),
      // so first render does not appear disconnected.
      filteredIds.value = null;
      highlightPathsByIds(Object.keys(svgMapUnitIdToPath.value));
      filteredFloorNumbers.value = null;
    });
};

const parseSvg = () => {
  if (svgContainer.value) {
    svgMapUnitIdToPath.value = svgParser(svgContainer.value);
    if (!svgContainer.value.children[0]) return;
    svgContainer.value.children[0].setAttribute("preserveAspectRatio", "xMidYMid slice");
    // Make the shapes visible outside the SVG container.
    // This is for smaller screen where the SVG is not fully visible.
    svgContainer.value.children[0].style.overflow = "visible";
  }
};

const loadNewSvgContent = async () => {
  await nextTick(() => {
    parseSvg();
    console.log('[svg-debug] currentView:', currentView.value);
    console.log('[svg-debug] svg_overlay present:', !!currentView.value?.svg_overlay);
    console.log('[svg-debug] svg_overlay length:', currentView.value?.svg_overlay?.length);
    console.log('[svg-debug] parsedPaths count:', Object.keys(svgMapUnitIdToPath.value).length);
    console.log('[svg-debug] units count:', Object.keys(units).length);
    highlightPathsByIds(filteredIds.value ?? Object.keys(svgMapUnitIdToPath.value));
  });
};

const resetPathStyle = (id) => {
  const path = svgMapUnitIdToPath.value[id];
  if (path) {
    path.classList.add("tw-fill-transparent");
    path.classList.remove("tw-stroke-white", "tw-cursor-pointer", "clickable");
    path.style.fill = "";
  }
};

const resetCurrentPaths = () => {
  currentlyHighlightedIds.value.forEach(resetPathStyle);
  currentlyHighlightedIds.value = [];
};

const highlightPathsByIds = (idList) => {
  resetCurrentPaths();
  idList.forEach(highlightPathById);
};

const highlightPathById = (id) => {
  const path = svgMapUnitIdToPath.value[id];
  console.log('[svg-debug] highlight attempt:', id, '→ path found:', !!path, '| unit found:', !!units[id]);
  if (path && units[id]) {
    currentlyHighlightedIds.value.push(id);
    path.classList.add("tw-stroke-white", "tw-stroke-[0.5]", "tw-cursor-pointer", "clickable");
    path.style.fill = `${bedroomColors[units[id].number_of_bedrooms]}7A`;
  }
};

// Track the old ID to reset the previous hovered unit
const oldId = ref(null);

const handleSvgMouseOver = async (event) => {
  if (animationInProgress.value) return;

  const id = event.target.dataset.id;
  const isClickable = event.target.classList.contains("clickable");

  if (oldId.value) {
    // Rare case when the SVG has changed, therefore, we don't have the oldId in the new SVG.
    if (svgMapUnitIdToPath.value[oldId.value]) {
      svgMapUnitIdToPath.value[oldId.value].style.fill = `${bedroomColors[units[oldId.value].number_of_bedrooms]}7A`;
    }
    hoveredUnit.value = null;
  }

  if (!id || !isClickable) return;

  oldId.value = id;

  svgMapUnitIdToPath.value[id].style.fill = `${bedroomColors[units[id].number_of_bedrooms]}A3`;

  hoveredUnit.value = units[id];
  await nextTick();
  childPositioning(event.clientX + 2, event.clientY + 2, svgContainerRect.value, unitHoverCardWrap.value);
};

const resetHoverCard = () => {
    // Reset the fill style of the previously hovered unit
  if (oldId.value && svgMapUnitIdToPath.value[oldId.value]) {
    svgMapUnitIdToPath.value[oldId.value].style.fill = `${bedroomColors[units[oldId.value].number_of_bedrooms]}7A`;
  }

  // Hide the hover unit card
  hoveredUnit.value = null;
  oldId.value = null;
};

const handleSvgMouseLeave = () => {
  resetHoverCard();
  // unitMapCard.value.close(); // Close any open unit cards
};


const selectedUnit = ref(null);

const selectUnit = (unit) => {
  selectedUnit.value = unit;
  unitMapCard.value.open(unit);
};

const closeSelectedUnit = () => {
  selectedUnit.value = null;
  unitMapCard.value.close();
};

// Close the when the user starts moving the canvas.
const onCanvasTransform = () => {
  if (!selectedUnit.value) return;

  resetHoverCard();
  closeSelectedUnit();
}

provide("onTransform", onCanvasTransform);

const handleSvgClick = async (event) => {
  unitMapCard.value.close(); // Close any open unit cards

  const clickedElement = event.target;

  // Check if this is a floor shape click (from elevation view)
  const floorNumber = clickedElement.dataset.floor;
  if (floorNumber !== undefined) {
    // This is a floor shape in elevation view - emit event to navigate to floor plate
    const floor = parseInt(floorNumber, 10);
    const videoSrc = getVideoSrc();
    const reverseVideoSrc = getReverseVideoSrc();
    emit('open-floor-plate', { floor, videoSrc, reverseVideoSrc });
    return;
  }

  // Original unit click handling
  const id = clickedElement.dataset.id;
  const isClickable = clickedElement.classList.contains("clickable");

  const unit = units?.[id];
  if (!unit || !isClickable) return;

  hoveredUnit.value = null;
  selectUnit(unit);
  await nextTick();

  childPositioning(event.clientX, event.clientY, svgContainerRect.value, unitMapCardWrap.value);
};

const handleImageLoad = () => {
  isLoading.value = false;
};

const isFastMode = getQueryParamBoolean("fast", null);
const skipVideo = isFastMode === null ? saveDataConnection() || isMobile() : isFastMode;

const getVideo = (image) => {
  if (skipVideo) {
    video.value = null;
    // videoPoster.value = null;
    return;
  }

  if (!image || !image.views || !image.views.length) {
    video.value = null;
    return;
  }

    const src = image.views[0]?.video_filename;
  video.value = (typeof src === 'string' && src.length > 0) ? src : null;
  // videoPoster.value = image.filename;
  nextTick(() => videoPlayer.value?.load());
};


const getThreeSixtyPins = (pins) => {
  threeSixtyPins.value = pins;
  emit("current-media360", pins);
};

const getAmenityPins = (pins) => {
  amenityPins.value = pins;
};

const openGallery = (i) => {
  emit("open-gallery", i);
};

const openUnitGallery = (image) => {
  emit("open-unit-gallery", image);
};

const openIframeGallery = (link) => {
  emit("open-iframe-gallery", link);
};

const openPaymentPlan = (uId) => {
  emit("open-payment-plan", uId);
};

const openAmenityGallery = (i) => {
    emit("open-amenity-gallery", i)
};

// ─── Floor Plans / Elevation overlay mode ─────────────────────────────────
const overlayMode = ref('units'); // 'units' | 'elevation'

const elevationData = computed(() => {
  // Check current view first
  const view = currentView.value;
  if (view?.elevation_svg) {
    return {
      elevationSvg: view.elevation_svg,
    };
  }
  // Fallback: find any view with elevation SVG across all views
  for (const entry of currentViews.value) {
    const v = entry.view;
    if (v?.elevation_svg) {
      return {
        elevationSvg: v.elevation_svg,
      };
    }
  }
  return null;
});

const hasFloorPlans = computed(() => {
  return currentViews.value.some(entry =>
    entry.view?.elevation_svg
  );
});

const elevationSvgContainer = ref(null);
const floorShapeMap = ref({});
const hoveredFloor = ref(null);

const parseElevationSvg = () => {
  if (!elevationSvgContainer.value || !elevationData.value) return;

  const shapes = elevationSvgContainer.value.querySelectorAll(
    "path, rect, polygon, ellipse, circle"
  );

  floorShapeMap.value = {};

  // Reset all shapes to transparent, no interaction
  shapes.forEach((shape) => {
    shape.classList.add("tw-fill-transparent", "tw-transition-all", "tw-duration-200");
    shape.style.stroke = "none";
    shape.style.fill = "";
    shape.style.pointerEvents = "none";
  });

  // Highlight mapped floor shapes using data-floor attributes in the SVG
  shapes.forEach((shape) => {
    const floorAttr = shape.getAttribute("data-floor");
    if (!floorAttr) return;
    const floor = parseInt(floorAttr, 10);
    if (Number.isNaN(floor)) return;

    const hasFilteredFloors = Array.isArray(filteredFloorNumbers.value);
    const isFloorEligible = !hasFilteredFloors || filteredFloorNumbers.value.includes(floor);
    if (!isFloorEligible) {
      shape.classList.remove("tw-cursor-pointer", "tw-stroke-white", "tw-stroke-[0.5]", "clickable");
      shape.style.fill = "transparent";
      shape.style.pointerEvents = "none";
      return;
    }

    // Clear inline stroke reset so utility classes take effect
    shape.style.stroke = "";
    shape.style.strokeWidth = "";
    shape.classList.add("tw-cursor-pointer", "tw-stroke-white", "tw-stroke-[0.5]", "clickable");
    shape.style.fill = "transparent";
    shape.style.pointerEvents = "all";
    floorShapeMap.value[floor] = shape;
  });

  const svgEl = elevationSvgContainer.value.querySelector("svg");
  if (svgEl) {
    svgEl.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svgEl.style.overflow = "visible";
  }
};

const floorBadgePos = ref({ x: 0, y: 0 });

const computeFloorBadgePos = (rect) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const padding = 8;
  const gap = 8;

  const badgeWidth = 40;
  const badgeHeight = 40;
  const tooltipWidth = 180;
  const tooltipHeight = 64;
  const groupWidth = tooltipWidth + gap + badgeWidth;
  const groupHeight = Math.max(tooltipHeight, badgeHeight);

  const leftFits = rect.left - groupWidth - gap >= padding;
  const rightFits = rect.right + groupWidth + gap <= viewportWidth - padding;
  const underFits = rect.bottom + groupHeight + gap <= viewportHeight - padding;

  let x;
  let y;

  const centerY = rect.top + rect.height / 2 - groupHeight / 2;
  const verticalNudge = -4;

  if (leftFits) {
    x = rect.left - groupWidth - gap;
    y = centerY + verticalNudge;
  } else if (rightFits) {
    x = rect.right + gap;
    y = centerY + verticalNudge;
  } else {
    // Fallback under, centered
    x = rect.left + rect.width / 2 - groupWidth / 2;
    y = rect.bottom + gap;
    if (!underFits) {
      y = centerY + verticalNudge;
    }
  }

  x = Math.min(Math.max(x, padding), viewportWidth - groupWidth - padding);
  y = Math.min(Math.max(y, padding), viewportHeight - groupHeight - padding);

  return { x, y };
};

const resetFloorHighlight = (shape) => {
  shape.style.fill = "transparent";
  shape.style.stroke = "";
  shape.style.strokeWidth = "";
  // Re-apply default stroke classes
  shape.classList.add("tw-stroke-white", "tw-stroke-[0.5]");
};

const handleElevationMouseOver = (event) => {
  const floorAttr = event.target.dataset?.floor;
  if (!floorAttr) return;

  const floor = parseInt(floorAttr, 10);

  // Clear previous hover
  if (hoveredFloor.value !== null && floorShapeMap.value[hoveredFloor.value]) {
    resetFloorHighlight(floorShapeMap.value[hoveredFloor.value]);
  }

  hoveredFloor.value = floor;
  if (floorShapeMap.value[floor]) {
    const shape = floorShapeMap.value[floor];
    // Apply hover style: teal fill + solid white border
    shape.style.fill = "rgba(0, 206, 201, 0.32)";
    shape.style.stroke = "rgba(255, 255, 255, 1)";
    shape.style.strokeWidth = "1";
    // Remove Tailwind stroke classes so inline style takes precedence
    shape.classList.remove("tw-stroke-white", "tw-stroke-[0.5]");

    const rect = shape.getBoundingClientRect();
    floorBadgePos.value = computeFloorBadgePos(rect);
  }
};

const handleElevationMouseMove = (event) => {
  const floorAttr = event.target?.dataset?.floor;
  if (!floorAttr) {
    handleElevationMouseLeave();
  }
};

const handleElevationMouseLeave = () => {
  if (hoveredFloor.value !== null && floorShapeMap.value[hoveredFloor.value]) {
    resetFloorHighlight(floorShapeMap.value[hoveredFloor.value]);
  }
  hoveredFloor.value = null;
};

const handleElevationClick = async (event) => {
    const floorAttr = event.target.dataset?.floor;
    if (!floorAttr) return;
    const floor = parseInt(floorAttr, 10);
    if (!floorShapeMap.value[floor]) return;

    const videoSrc = getVideoSrc();
    const reverseVideoSrc = getReverseVideoSrc();

    emit('open-floor-plate', { floor: floor, videoSrc: videoSrc, reverseVideoSrc: reverseVideoSrc });
};

const getVideoSrc = () => {
    const isDayMode = viewMode === 'day';
    if (isDayMode) {
        return currentView.value?.transition_videos.find((video) => video.is_day)?.filename ?? null;
    }

    return currentView.value?.transition_videos.find((video) => !video.is_day)?.filename ?? null;
}

const getReverseVideoSrc = () => {
    const isDayMode = viewMode === 'day';
    if (isDayMode) {
        return currentView.value?.transition_videos.find((video) => video.is_day)?.reverse_video_filename ?? null;
    }

    return currentView.value?.transition_videos.find((video) => !video.is_day)?.reverse_video_filename ?? null;
}

const hoveredFloorStats = computed(() => {
  if (hoveredFloor.value === null) return null;
  return floorUnitStats?.[hoveredFloor.value] || { total: 0, available: 0 };
});

const toggleFloorPlans = () => {
  if (overlayMode.value === 'elevation') {
    overlayMode.value = 'units';
    hoveredFloor.value = null;
    nextTick(() => {
      loadNewSvgContent();
      filter();
    });
  } else {
    overlayMode.value = 'elevation';
    resetHoverCard();
    if (selectedUnit.value) closeSelectedUnit();
    nextTick(() => {
      parseElevationSvg();
      filter();
    });
  }
};

defineExpose({ toggleFloorPlans, overlayMode, hasFloorPlans });

onBeforeMount(() => {
  if(!restoreBuildingState()) {
    activeViewIdx.value = currentViews.value.length > 0 ? 0 : 0;
  }
});

onMounted(async () => {
  await loadNewSvgContent();
  const viewImage = currentViewImage.value;
  getVideo(viewImage);
  getThreeSixtyPins(viewImage?.media360);
  getAmenityPins(viewImage?.mapped_amenity);
  handleImageLoad();
  filter();

  // Create and initialize the resize observer for swipeContainer
  swipeResizeObserver.value = new ResizeObserver(() => {
    centerScrollContent();
  });

  if (swipeContainer.value) {
    swipeResizeObserver.value.observe(swipeContainer.value);
    // Initial centering
    centerScrollContent();
  }
});

// Clean up the resize observer when component is unmounted
onBeforeUnmount(() => {
  if (swipeResizeObserver.value) {
    swipeResizeObserver.value.disconnect();
  }
});

// Watch for view mode changes
watch(
  () => currentView.value?.elevation_svg,
  async () => {
    if (overlayMode.value !== 'elevation') return;
    await nextTick(() => {
      parseElevationSvg();
    });
  }
);

watch(
    () => viewMode,
    async () => {
          // Get the orientation from saved state (which was saved before the mode changed)
          const savedState = getProjectState.value(getBuildingKey.value);
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
          getThreeSixtyPins(viewImage?.media360);
          getAmenityPins(viewImage?.mapped_amenity);
          filter();
});
</script>

<template>
  <UnderConstruction v-if="building.units.length === 0" :building="building" />

  <div v-if="building?.images" ref="animationContainer" class="tw-fixed tw-inset-0">

    <ImageCanvas
      ref="canvas"
      :views="currentViews"
      :src-key="getBuildingKey"
      @animatePrev="() => animate(-1)"
      @animateNext="() => animate(1)"
      @previousImagesLoaded="(val) => (prevImagesLoaded = val)"
      @nextImagesLoaded="(val) => (nextImagesLoaded = val)"
    >
      <template #overlay>
        <video
          ref="videoPlayer"
          v-show="video !== null && typeof video === 'string'"
          autoplay
          loop
          muted
          playsinline
          class="tw-absolute tw-object-cover tw-top-0 tw-left-0 tw-w-full tw-h-full"
        >
          <source :src="video" type="video/mp4" media="(min-width: 640px)" />
        </video>

        <!-- Unit SVG overlay (3D view mode) -->
        <div
          v-if="overlayMode === 'units'"
          v-show="currentView"
          :class="{ 'tw-opacity-0': isLoading || animationInProgress }"
          @click="handleSvgClick"
          @mouseover="handleSvgMouseOver"
          @mouseleave="handleSvgMouseLeave"
          class="tw-absolute tw-top-0 tw-left-0 tw-w-full tw-h-full tw-flex tw-justify-center tw-items-center [&>svg]:tw-w-full [&>svg]:tw-h-full tw-pointer-events-none"
          ref="svgContainer"
          v-html="currentView?.svg_overlay"
        ></div>

        <!-- Elevation SVG overlay (Floor plans mode) -->
        <div
          v-if="overlayMode === 'elevation' && elevationData"
          :class="{ 'tw-opacity-0': isLoading || animationInProgress }"
          @click="handleElevationClick"
          @mouseover="handleElevationMouseOver"
          @mousemove="handleElevationMouseMove"
          @mouseleave="handleElevationMouseLeave"
          class="tw-absolute tw-top-0 tw-left-0 tw-w-full tw-h-full tw-flex tw-justify-center tw-items-center [&>svg]:tw-w-full [&>svg]:tw-h-full [&>svg]:tw-pointer-events-auto"
          ref="elevationSvgContainer"
          v-html="elevationData.elevationSvg"
        ></div>

        <template v-if="overlayMode === 'units' && threeSixtyPins">
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

        <template v-if="overlayMode === 'units' && amenityPins">
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

    <!-- </div> -->
    <!-- </ZoomWrapper> -->

    <div ref="unitMapCardWrap" class="tw-z-[999]">
      <UnitMapCard
        ref="unitMapCard"
        :view-mode="viewMode"
        :has-payment-plans="building.payment_plans_count > 0"
        @open-unit-gallery="openUnitGallery"
        @open-payment-plan="(id) => openPaymentPlan(id)"
        @open-iframe-gallery="openIframeGallery"
        @card-clicked="(unit) => emit('openUnitDrawer', unit)"
      />
    </div>

    <!--  HOVER CARD-->
    <div ref="unitHoverCardWrap" class="max-md:tw-hidden tw-z-[1000] tw-pointer-events-none">
      <div
        v-if="hoveredUnit"
        class="tw-p-2 tw-min-w-[80px] tw-space-y-1 tw-bg-white tw-rounded tw-w-fit tw-text-center tw-relative"
      >
        <p class="tw-font-semibold">{{ hoveredUnit.name }}</p>
        <p
          v-if="hoveredUnit.layout_code"
          class="tw-text-xs tw-text-[#4B4144] tw-px-1 tw-py-0.5 tw-bg-[#EAE9D7] tw-rounded-sm"
        >
          {{ hoveredUnit.layout_code }}
        </p>
        <p class="tw-text-xs">Floor {{ hoveredUnit.floor }}</p>
      </div>
    </div>

    <!-- Map Rotation widget -->
    <div
      v-if="currentViews.length > 1"
      class="tw-fixed tw-z-50 tw-max-w-max tw-w-full tw-text-white tw-flex tw-items-center tw-justify-between tw-gap-3 tw-left-0 tw-right-0 tw-bottom-[76px] md:tw-bottom-6 tw-mx-auto tw-rounded-xl tw-p-3 tw-bg-[#232323] tw-bg-opacity-70"
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

    <!-- Floor badge + tooltip (elevation mode) - tooltip on the left -->
    <div
      v-if="overlayMode === 'elevation' && hoveredFloor !== null"
      class="tw-fixed tw-z-[1000] tw-pointer-events-none tw-flex tw-items-center tw-gap-2"
      :style="{
        left: `${floorBadgePos.x}px`,
        top: `${floorBadgePos.y}px`,
      }"
    >
      <!-- Floor info tooltip -->
      <div class="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-2 tw-min-w-[160px]">
        <p class="tw-text-sm tw-font-semibold tw-text-[#241C15]">Floor {{ hoveredFloor }}</p>
        <div v-if="hoveredFloorStats" class="tw-mt-2 tw-border-t tw-border-gray tw-pt-2 tw-flex tw-flex-col tw-gap-2">
          <div class="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-text-sm tw-text-[#4B4144]">
            <span>Total Apartments</span>
            <span class="tw-font-semibold tw-text-right">{{ hoveredFloorStats.total }}</span>
          </div>
          <div class="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-text-sm tw-text-[#4B4144]">
            <span>Available</span>
            <span class="tw-font-semibold tw-text-right">{{ hoveredFloorStats.available }}</span>
          </div>
        </div>
      </div>
      <!-- Floor number badge -->
      <div class="tw-flex tw-items-center tw-justify-center tw-text-white tw-font-semibold tw-shrink-0 tw-w-10 tw-h-10 tw-rounded-lg tw-border tw-border-white/30 tw-bg-[#241C15]/80">
        {{ hoveredFloor }}
      </div>
    </div>
  </div>
</template>
