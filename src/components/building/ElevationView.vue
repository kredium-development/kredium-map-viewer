<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";

const props = defineProps({
  /** The building object containing images (with views that have elevation_svg) */
  building: { type: Object, required: true },
  /** Per-floor unit stats: { [floor]: { total, available } } */
  floorUnitStats: { type: Object, default: () => ({}) },
  /** Eligible floors returned by backend floor filter */
  eligibleFloors: { type: Array, default: null },
});

const emit = defineEmits(["select-floor"]);

// ─── Find the elevation data ────────────────────────────────────────────
const elevationData = computed(() => {
  const images = props.building?.images || [];
  for (const image of images) {
    if (!image.views) continue;
    for (const view of image.views) {
      if (view.elevation_svg) {
        return {
          image,
          view,
          elevationSvg: view.elevation_svg,
        };
      }
    }
  }
  return null;
});

// ─── DOM refs ────────────────────────────────────────────────────────────
const svgContainer = ref(null);
const containerRef = ref(null);
const floorShapeMap = ref({}); // floor number → DOM element
const hoveredFloor = ref(null);
const tooltipPos = ref({ x: 0, y: 0 });
const eligibleFloorSet = computed(() => {
  if (!Array.isArray(props.eligibleFloors)) return null;
  return new Set(
    props.eligibleFloors
      .map((floor) => Number.parseInt(floor, 10))
      .filter((floor) => !Number.isNaN(floor))
  );
});

// ─── Parse elevation SVG and read data-floor attributes ─────────────────
const parseElevationSvg = () => {
  if (!svgContainer.value || !elevationData.value) return;

  // Query all shape elements (path, rect, polygon, ellipse, circle)
  const shapes = svgContainer.value.querySelectorAll(
    "path, rect, polygon, ellipse, circle"
  );

  floorShapeMap.value = {};

  shapes.forEach((shape) => {
    // Reset every shape first so swapped v-html content never keeps default fills.
    shape.classList.add("tw-fill-transparent", "tw-transition-all", "tw-duration-200");
    shape.classList.remove("tw-cursor-pointer", "tw-stroke-white", "tw-stroke-[0.5]");
    shape.style.fill = "transparent";
    shape.style.stroke = "none";
    shape.style.pointerEvents = "none";

    const floorAttr = shape.getAttribute("data-floor");
    if (!floorAttr) return;
    const floor = parseInt(floorAttr, 10);
    if (Number.isNaN(floor)) return;

    const isFloorEligible = !eligibleFloorSet.value || eligibleFloorSet.value.has(floor);
    if (!isFloorEligible) return;

    shape.classList.add("tw-cursor-pointer", "tw-stroke-white", "tw-stroke-[0.5]");
    shape.style.stroke = "";
    shape.style.pointerEvents = "all";
    floorShapeMap.value[floor] = shape;
  });

  // Ensure SVG fills the container
  const svgEl = svgContainer.value.querySelector("svg");
  if (svgEl) {
    svgEl.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svgEl.style.overflow = "visible";
  }
};

// ─── Hover handlers ──────────────────────────────────────────────────────
const handleMouseOver = (event) => {
  const floorAttr = event.target.dataset?.floor;
  if (!floorAttr) return;

  const floor = parseInt(floorAttr, 10);

  // Clear previous hover
  if (hoveredFloor.value !== null && floorShapeMap.value[hoveredFloor.value]) {
    floorShapeMap.value[hoveredFloor.value].style.fill = "transparent";
  }

  hoveredFloor.value = floor;

  // Highlight the floor shape
  if (floorShapeMap.value[floor]) {
    floorShapeMap.value[floor].style.fill = "rgba(255, 255, 255, 0.25)";
  }

  tooltipPos.value = { x: event.clientX, y: event.clientY };
};

const handleMouseMove = (event) => {
  if (hoveredFloor.value !== null) {
    tooltipPos.value = { x: event.clientX, y: event.clientY };
  }
};

const handleMouseLeave = () => {
  if (hoveredFloor.value !== null && floorShapeMap.value[hoveredFloor.value]) {
    floorShapeMap.value[hoveredFloor.value].style.fill = "transparent";
  }
  hoveredFloor.value = null;
};

// ─── Click handler ───────────────────────────────────────────────────────
const handleClick = (event) => {
  const floorAttr = event.target.dataset?.floor;
  if (!floorAttr) return;

  const floor = parseInt(floorAttr, 10);
  if (!floorShapeMap.value[floor]) return;
  emit("select-floor", floor);
};

// ─── Tooltip data ────────────────────────────────────────────────────────
const hoveredFloorStats = computed(() => {
  if (hoveredFloor.value === null) return null;
  return props.floorUnitStats[hoveredFloor.value] || { total: 0, available: 0 };
});

// ─── Lifecycle ───────────────────────────────────────────────────────────
onMounted(() => {
  nextTick(() => parseElevationSvg());
});

watch(
  () => elevationData.value?.elevationSvg,
  () => nextTick(() => parseElevationSvg())
);

watch(
  () => props.eligibleFloors,
  () => nextTick(() => parseElevationSvg()),
  { deep: true }
);
</script>

<template>
  <div v-if="elevationData" ref="containerRef" class="tw-relative tw-w-full tw-h-full">
    <!-- Building image -->
    <img
      :src="elevationData.image.filename"
      :alt="elevationData.image.original_filename || 'Building elevation'"
      class="tw-w-full tw-h-full tw-object-contain"
    />

    <!-- Elevation SVG overlay -->
    <div
      ref="svgContainer"
      class="tw-absolute tw-top-0 tw-left-0 tw-w-full tw-h-full tw-flex tw-justify-center tw-items-center [&>svg]:tw-w-full [&>svg]:tw-h-full tw-pointer-events-none"
      @click="handleClick"
      @mouseover="handleMouseOver"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
      v-html="elevationData.elevationSvg"
    ></div>

    <!-- Floor badge (next to hover) -->
    <div
      v-if="hoveredFloor !== null"
      class="tw-fixed tw-z-[1000] tw-pointer-events-none"
      :style="{
        left: `${tooltipPos.x + 16}px`,
        top: `${tooltipPos.y - 20}px`,
      }"
    >
      <div class="tw-flex tw-items-start tw-gap-2">
        <!-- Floor number badge -->
        <div
          class="tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-white/30 tw-text-white tw-font-semibold tw-text-2xl"
          style="
            width: 40px;
            height: 40px;
            padding: 8px;
            background: rgba(36, 28, 21, 0.8);
          "
        >
          {{ hoveredFloor }}
        </div>

        <!-- Tooltip popup -->
        <div
          class="tw-bg-white tw-rounded-lg tw-shadow-lg tw-px-3 tw-py-2 tw-min-w-[160px]"
        >
          <p class="tw-font-semibold tw-text-sm tw-text-[#241C15] tw-mb-1">
            Floor {{ hoveredFloor }}
          </p>
          <p v-if="hoveredFloorStats" class="tw-text-xs tw-text-[#4B4144]">
            Total Apartments: {{ hoveredFloorStats.total }}
          </p>
          <p v-if="hoveredFloorStats" class="tw-text-xs tw-text-[#4B4144]">
            Available: {{ hoveredFloorStats.available }}
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Fallback when no elevation SVG exists -->
  <div v-else class="tw-flex tw-items-center tw-justify-center tw-w-full tw-h-full tw-text-gray-500">
    <p>No elevation view available</p>
  </div>
</template>
