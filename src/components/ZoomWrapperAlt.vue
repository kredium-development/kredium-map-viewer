<script setup>
import { inject, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import panzoom from "@panzoom/panzoom";
import InlineSvg from "./InlineSvg.vue";
import { isMobile } from "./utils";

const props = defineProps({
  width: {
    type: Number,
    required: true,
  },
});

const zoomLevel = ref(1);
const panzoomElement = ref(null);
const panzoomInstance = ref(null);
const maxScale = 2;
const RESIZE_DEBOUNCE_MS = 120;
const resizeDebounceTimer = ref(null);

const onTransform = inject("onTransform", () => {});

const emit = defineEmits(['onZoom']);

const isDesktop = !isMobile();

const canPanAtCurrentState = () => {
  if (!isDesktop) {
    return true;
  }

  if (zoomLevel.value > 1) {
    return true;
  }

  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;

  const contentWidth = props.width || 0;
  const contentHeight = panzoomElement.value?.getBoundingClientRect?.().height || 0;

  return contentWidth > viewportWidth || contentHeight > viewportHeight;
};

const syncPanAvailability = () => {
  if (!panzoomInstance.value) return;

  const canPan = canPanAtCurrentState();
  panzoomInstance.value.setOptions({
    disablePan: !canPan,
    cursor: canPan ? 'move' : 'default',
  });
};

// Width might change later, when the actual image is rendered on canvas.
watch(() => props.width, async (newWidth) => {
  if (newWidth > 0) {
    await nextTick();
    centerContent();
    syncPanAvailability();
  }
});

// Center the content after initialization
const centerContent = () => {
  if (!panzoomElement.value) return;

  const viewportWidth = document.documentElement.clientWidth;
  const x = (viewportWidth - props.width) / 2;

  // Pan to center
  panzoomInstance.value.pan(x, 0);
};

const zoomInit = async () => {
  panzoomInstance.value = panzoom(panzoomElement.value, {
    maxScale,
    minScale: 1,
    contain: "outside",
    disablePan: false,
    cursor: 'move',
    handleStartEvent: (event) => {
      event.preventDefault();
      if (canPanAtCurrentState()) {
        event.stopPropagation();
      }
    },
    setTransform: (_, { x, y, scale }) =>{
      panzoomElement.value.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      onTransform({ x, y, scale });
    },
  });

  await nextTick();

  // Update zoom level when zooming
  panzoomElement.value.addEventListener("panzoomzoom", (e) => {
    zoomLevel.value = e?.detail?.scale ?? 1;
    emit('onZoom', zoomLevel.value);
    syncPanAvailability();
  });

  panzoomElement.value.addEventListener("wheel", (e) => {
    panzoomInstance.value.zoomWithWheel(e);
  });

  centerContent();
  syncPanAvailability();
};

const handleViewportResize = () => {
  if (resizeDebounceTimer.value) {
    clearTimeout(resizeDebounceTimer.value);
  }

  resizeDebounceTimer.value = setTimeout(() => {
    syncPanAvailability();
    resizeDebounceTimer.value = null;
  }, RESIZE_DEBOUNCE_MS);
};

const zoomIn = () => {
  if (zoomLevel.value >= maxScale) return;
  panzoomInstance.value?.zoomIn();
};

const zoomOut = () => {
  if (zoomLevel.value <= 1) return;
  panzoomInstance.value?.zoomOut();
};

onMounted(() => {
  zoomInit();
  window.addEventListener('resize', handleViewportResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleViewportResize);

  if (resizeDebounceTimer.value) {
    clearTimeout(resizeDebounceTimer.value);
    resizeDebounceTimer.value = null;
  }

  if (panzoomInstance.value) {
    panzoomInstance.value.destroy();
    panzoomInstance.value = null;
  }
});

defineExpose({
  reset: () => {
    panzoomInstance.value?.reset();
    zoomLevel.value = 1;
  },
  centerContent, // Expose the centerContent method to allow external calls when image is loaded.
});
</script>

<template>
  <div class="panzoom-container" :style="{ width: width === 0 ? '100%' : `${width}px` }" ref="panzoomElement">
    <slot />
  </div>

  <!-- Zoom Widget -->
  <div class="tw-fixed tw-z-20 tw-grid tw-gap-2 -tw-right-2.5 md:tw-right-0 tw-top-1/2 -tw-translate-x-1/2">
    <button
      class="map-button"
      @click="zoomIn"
    >
      <inline-svg icon="plus" />
    </button>
    <button
      class="map-button"
      @click="zoomOut"
    >
      <inline-svg icon="minus" />
    </button>
  </div>
</template>

<style scoped>
.panzoom-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}
</style>
