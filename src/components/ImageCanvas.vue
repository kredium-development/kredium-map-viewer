<script setup>
import {onBeforeUnmount, onMounted, ref, watch, watchEffect, nextTick, toRefs} from "vue";
import {preloadImages} from "./imagePreloader";
import {getQueryParamBoolean, isMobile, isReducedMotion, saveDataConnection, wrapIndex} from "./utils";
import ZoomWrapperAlt from "./ZoomWrapperAlt.vue";
import Swipe from "./swipe";
import { storeToRefs } from "pinia";
import { useMapAnimationStore } from "@/stores/mapAnimationStore";

const props = defineProps({
  views: { type: Array, default: () => [] },
  srcKey: { type: String, required: false },
});
const { views: sourceViews, srcKey } = toRefs(props);

/** @type {Ref<HTMLCanvasElement | null>} */
const canvas = ref(null);
/** @type {Ref<HTMLCanvasElement | null>} */
const transitionCanvas = ref(null);
/** @type {Ref<CanvasRenderingContext2D | null>} */
const ctx = ref(null);
/** @type {Ref<CanvasRenderingContext2D | null>} */
const transitionCtx = ref(null);
const container = ref(null);
/** @type {Ref<ResizeObserver | null>} */
const resizeObserver = ref(null);
const frameIndexMap = ref(new Map());
const lastDrawnImage = ref(null);
const zoomWrapper = ref();
const swipeHandler = new Swipe();

// Cache container properties to avoid layout thrashing
const containerInfo = ref({
  left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0,
  aspectRatio: 1
});

// Track the overlay element
const overlay = ref(null);

resizeObserver.value = new ResizeObserver(() => {
  const rect = container.value?.getBoundingClientRect() || { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
  containerInfo.value = {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
    // Calculate aspect ratio to maintain image proportions
    aspectRatio: (rect.width || 1) / (rect.height || 1)
  };

  if (!lastDrawnImage.value) return;

  drawImage(lastDrawnImage.value);
});

const canvasSize = ref({ width: 0, height: 0 });

const emit = defineEmits(["previousImagesLoaded", "nextImagesLoaded", "resize", "animatePrev", "animateNext", "onZoom", "canvasStateRestored"]);

const drawToCanvas = (image, targetCanvas = canvas, targetCtx = ctx) => {
  if (!targetCtx.value) targetCtx.value = targetCanvas.value?.getContext("2d");
  if (!targetCtx.value || !targetCanvas.value || !image) {
    return;
  }

  const imageWidth = image.width;
  const imageHeight = image.height;

  // Calculate aspect ratios
  const imageAspectRatio = imageWidth / imageHeight;
  const containerAspectRatio = containerInfo.value.aspectRatio;

  let canvasWidth, canvasHeight;

  // CASE 1: Use true "cover" mode for desktop (both dimensions fit)
  // CASE 2: Handle mobile where height is bigger than width but width can't fit
  if (containerAspectRatio > imageAspectRatio) {
    // Container is wider than image (relative to height)
    // Scale based on width to cover container
    canvasWidth = containerInfo.value.width;
    canvasHeight = canvasWidth / imageAspectRatio;
  } else {
    // Container is taller than image (relative to width)
    // Scale based on height to cover container
    canvasHeight = containerInfo.value.height;
    canvasWidth = canvasHeight * imageAspectRatio;
  }

  // Update canvas size
  targetCanvas.value.width = canvasWidth;
  targetCanvas.value.height = canvasHeight;

  // Clear and draw the image scaled to cover
  targetCtx.value.clearRect(0, 0, canvasWidth, canvasHeight);
  targetCtx.value.drawImage(image, 0, 0, imageWidth, imageHeight, 0, 0, canvasWidth, canvasHeight);

  // Only update lastDrawnImage and canvasSize for main canvas
  // if (targetCanvas === canvas.value) {
    lastDrawnImage.value = image;
    canvasSize.value = {
      width: canvasWidth,
      height: canvasHeight
    };
  // }
};

const drawImage = (image) => {
  drawToCanvas(image, canvas, ctx);};

const centerContent = () => {
  zoomWrapper.value?.centerContent();
}

const performTransition = async (duration = 500) => {
  if (!transitionCanvas.value) return;

  // Start transition with canvas fully opaque
  transitionCanvas.value.style.opacity = '1';
  transitionCanvas.value.style.display = 'block';
  transitionCanvas.value.style.transition = 'none';

  await nextTick();

  // Fade out the transition canvas to reveal new image underneath
  transitionCanvas.value.style.transition = `opacity ${duration}ms ease-in-out`;
  transitionCanvas.value.style.opacity = '0';

  // Wait for animation to complete
  await new Promise(resolve => setTimeout(resolve, duration));

  // Hide the transition canvas
  transitionCanvas.value.style.display = 'none';
  transitionCanvas.value.style.transition = 'none';
};

const loadFirstImage = async () => {
  // Safety check: Ensure frameIndex is within bounds.
  // Why: This prevents array out-of-bounds errors if initialize() is called
  // with invalid persisted state or after a mode switch.
  const currentView = viewState.value[currentViewIndex.value];
  const firstFrame = currentView?.frames?.[0];

  if (!firstFrame) return;

  // Fast path: If image is already cached (e.g., from previous preloading),
  // just draw it immediately without reloading.
  // Why: This prevents unnecessary network requests and speeds up rendering
  // when switching back to a previously viewed mode/building.
  if (firstFrame.cachedImageData) {
    drawImage(firstFrame.cachedImageData);
    await nextTick();
    centerContent();
    return;
  }

  // Slow path: Load the image for the first time.
  // Why: On initial load or cache miss, we need to fetch and decode the image.
  firstFrame.loading = true;
  try {
    const loadedImages = await Promise.all(preloadImages([firstFrame], !isMobile()));
    const imageData = loadedImages[0].image;
    firstFrame.cachedImageData = imageData;
    drawImage(imageData);
    await nextTick();
    centerContent();
  } catch (error) {
    console.error("Error loading image:", error);
  } finally {
    firstFrame.loading = false;
  }
};

/******************************
 * Image Preloading
 ******************************/
// Index of the current view
// This is used to determine if view around it are loaded.
const currentViewIndex = ref(0);
const mapAnimationStore = useMapAnimationStore();
const { getCanvasState } = storeToRefs(mapAnimationStore)
const viewState = ref([]);

// Skip animation if the user has a data saver connection or reduced motion preference
// No need to preload images
// Manual override for fast mode
const isFastMode = getQueryParamBoolean("fast", null);
const skipAnimation = isFastMode === null ? saveDataConnection() || isReducedMotion() || isMobile() : isFastMode;

watchEffect(() => {
  if (viewState.value.length === 0) return;
  const currentView = viewState.value[currentViewIndex.value];
  const prevView = viewState.value[wrapIndex(currentViewIndex.value - 1, viewState.value.length)];
  if (currentView?.loaded) {
    emit("nextImagesLoaded", currentView.loaded);
  }

  if (prevView?.loaded) {
    emit("previousImagesLoaded", prevView.loaded);
  }
});

const delayedPreload = ref(false);

/**
 * Handle the preloaded images.
 * Update the view and cache the loaded images.
 * @param {CanvasImageSource[]} loadedImages
 * @param {number} viewIdx - The index of the view.
 */
const handlePreloadedImages = (loadedImages, viewIdx) => {
  if (viewState.value[viewIdx]) {
    viewState.value[viewIdx].loaded = true;
  }

  loadedImages.forEach(({ image, index, url }) => {
    const frameInfo = frameIndexMap.value.get(index);
    if (!frameInfo) return;

    const view = viewState.value[frameInfo.viewIndex];
    const frame = view?.frames?.[frameInfo.frameIndex];

    if (frame && frame.url === url) {
      frame.cachedImageData = image;
    }
  });
};

const useWorker = !isMobile();

/**
 * Preload images for the current, next, and previous views to enable smooth animations.
 *
 * Why preload in both directions:
 * - Users can navigate both forward (next) and backward (prev)
 * - Without preloading, clicking next/prev would show loading states during animation
 * - This creates a seamless experience where animations always have data ready
 *
 * Why skip when skipAnimation=true:
 * - On mobile or slow connections, we load all view images at once (no animation frames)
 * - Preloading individual animation frames would be wasteful
 * - loadViews() handles the mobile case by loading just the final view images
 *
 * @param {number} index - The index of the current view.
 */
const preloadView = (index) => {
  if (skipAnimation) return;
  if (viewState.value.length === 0) return;

  const currentView = viewState.value[index];
  const nextIdx = wrapIndex(index + 1, viewState.value.length);
  const nextView = viewState.value[nextIdx];
  const previousIdx = wrapIndex(index - 1, viewState.value.length);
  const previousView = viewState.value[previousIdx];

  if (!currentView?.loaded && currentView?.frames) {
    Promise.all(preloadImages(currentView.frames, useWorker)).then((loadedImages) =>
      handlePreloadedImages(loadedImages, index)
    );
  }

  if (!nextView?.loaded && nextView?.frames) {
    Promise.all(preloadImages(nextView.frames, useWorker)).then((loadedImages) =>
      handlePreloadedImages(loadedImages, nextIdx)
    );
  }

  if (!previousView?.loaded && previousView?.frames) {
    Promise.all(preloadImages(previousView.frames, useWorker)).then((loadedImages) =>
      handlePreloadedImages(loadedImages, previousIdx)
    );
  }
};

/**
 * Load all the views for limited data connections (mobile/slow networks).
 * Only loads the first image of each view (the actual view image with hasView=true).
 */
const loadViews = () => {
  viewState.value.forEach((view, index) => {
    if (view.loaded) return;
    const viewImage = view.frames?.[0];
    if (!viewImage) return;

    Promise.all(preloadImages([viewImage], !isMobile())).then((loadedImages) => {
      handlePreloadedImages(loadedImages, index);
    });
  });
};

const initializeObserver = () => {
  resizeObserver.value.observe(container.value);
}

const buildViewGroups = () => {
  frameIndexMap.value.clear();
  let frameId = 0;

  viewState.value = (sourceViews.value || []).map((view, viewIndex) => {
    const frames = (view.frames || []).map((frame, frameIndex) => {
      const index = frameId;
      frameIndexMap.value.set(frameId, {
        viewIndex,
        frameIndex,
        url: frame.url,
      });
      frameId += 1;
      return {
        index,
        url: frame.url,
        loading: false,
        cachedImageData: null,
      };
    });

    return {
      frames,
      loaded: false,
    };
  });
};

const initialize = async () => {
  buildViewGroups();

  const persistedViewIndex = getCanvasState.value(srcKey.value)?.currentViewIndex ?? 0;

  if (persistedViewIndex >= 0 && persistedViewIndex < viewState.value.length) {
    currentViewIndex.value = persistedViewIndex;
  } else {
    currentViewIndex.value = 0;
  }

  frameIndex.value = 0;

  emit('canvasStateRestored', {
    srcKey: srcKey.value,
    currentViewIndex: currentViewIndex.value,
    totalViews: viewState.value.length,
  });

  loadFirstImage();
  preloadView(currentViewIndex.value);

  if (skipAnimation) {
    loadViews();
  }
};

watch(() => srcKey.value, (newKey, oldKey) => {
  // When source key changes, cache current state for the old key
  mapAnimationStore.addCanvasState(oldKey, {
    'currentViewIndex': currentViewIndex.value
  });
});

watch(() => sourceViews.value, (newSource, oldSource) => {
  /*
  * IMPORTANT: Detect if the source has ACTUALLY changed before resetting animation.
  *
  * Why: This watcher can be triggered even when the source array hasn't changed
  * (e.g., when BuildingView re-computes buildingImagesMapped due to internal state changes).
  * Resetting animation unnecessarily would:
  * 1. Lose the user's current position in the animation
  * 2. Cause jarring visual jumps
  * 3. Clear cached image data that could be reused
  *
  * How: We compare per-view frame counts and framesHash (URL XOR hash).
  * If any hash differs, we know it's a genuine mode switch (day→night) or building change.
  */
  if (!oldSource) {
    return;
  }

  let shouldResetAnimation = newSource.length !== oldSource.length;

  for (let i = 0; i < newSource.length && !shouldResetAnimation; i++) {
    const newView = newSource[i] || {};
    const oldView = oldSource[i] || {};
    const newCount = newView.frameCount ?? newView.frames?.length ?? 0;
    const oldCount = oldView.frameCount ?? oldView.frames?.length ?? 0;

    if (newCount !== oldCount) {
      shouldResetAnimation = true;
      break;
    }
    if ((newView.framesHash ?? null) !== (oldView.framesHash ?? null)) {
      shouldResetAnimation = true;
      break;
    }
  }

  if(shouldResetAnimation) {
    // Persist current canvas state for this srcKey before resetting
    mapAnimationStore.addCanvasState(srcKey.value, {
      'currentViewIndex': currentViewIndex.value
    });

    // Save old image to transition canvas before clearing
    if (lastDrawnImage.value) {
      drawToCanvas(lastDrawnImage.value, transitionCanvas, transitionCtx);
    }

    lastDrawnImage.value = null;

    // CRITICAL: Reset indices to 0 to prevent stale state issues.
    // Why: When switching modes (e.g., day→night), the image array changes completely.
    // The old frameIndex (e.g., 90) might point to an image that doesn't exist or isn't
    // preloaded in the new array. This causes "Missing cachedImageData" errors during animation.
    // By resetting to 0, we ensure we start fresh with the new image set, and BuildingView
    // will handle setting the correct view based on orientation matching.
    currentViewIndex.value = 0;
    frameIndex.value = 0;

    // Initialize and perform transition
    const initAndTransition = async () => {
      await initialize();
      await performTransition();

    };
    initAndTransition();
  }
});

const initializeSwipe = () => {
  // We don't want swipe gestures to trigger animation on mobile devices as there is no animation
  if(isMobile()) {
    return;
  }

  swipeHandler.start(container.value, () => {
    if(
      viewState.value.length > 0 &&
      !isAnimating.value &&
      viewState.value[wrapIndex(currentViewIndex.value - 1, viewState.value.length)]?.loaded
    ) {
      emit('animatePrev');
    }
  }, () => {
    if(viewState.value.length > 0 && !isAnimating.value && viewState.value[currentViewIndex.value]?.loaded) {
      emit('animateNext');
    }
  });
}

// Handle swipe on zoom - prevent swipe animation when zoomed in
const onZoom = (zoomLevel) => {
  if(zoomLevel > 1) {
    swipeHandler.removeListeners(container.value);
  } else {
    initializeSwipe();
  }
  emit('onZoom', zoomLevel);
}

onMounted(() => {
  initializeObserver();
  initialize();
  initializeSwipe();
});

/******************************
 * Animation
 ******************************/

// Current frame index
const frameIndex = ref(0);
const animationRequestId = ref(0);
const isAnimating = ref(false);

watch(isAnimating, (newValue) => {
  if (newValue === false && delayedPreload.value) {
    // Preload the next and previous images when the animation is done
    preloadView(currentViewIndex.value);
    delayedPreload.value = false;
  }
});

// Start preloading images when the current view changes
watch(currentViewIndex, (newIndex) => {
  if (isAnimating.value && isMobile()) {
    // Delay preloading until the animation is done
    delayedPreload.value = true;
  } else {
    preloadView(newIndex);
  }
});

const animationLoop = (direction, callback) => {
  if (direction !== 1 && direction !== -1) {
    console.error("Invalid direction");
    return;
  }

  isAnimating.value = true;

  const currentView = viewState.value[currentViewIndex.value];
  if (!currentView || !currentView.frames || currentView.frames.length === 0) {
    isAnimating.value = false;
    if (callback) callback(currentViewIndex.value);
    return;
  }

  if (skipAnimation) {
    isAnimating.value = false;
    if (callback) callback(currentViewIndex.value);
    return;
  }

  frameIndex.value += direction;

  if (frameIndex.value < 0) {
    frameIndex.value = 0;
    drawImage(currentView.frames[0]?.cachedImageData);
    isAnimating.value = false;
    if (callback) callback(currentViewIndex.value);
    return;
  }

  if (frameIndex.value >= currentView.frames.length) {
    isAnimating.value = false;
    if (callback) callback(currentViewIndex.value);
    return;
  }

  drawImage(currentView.frames[frameIndex.value]?.cachedImageData);
  animationRequestId.value = requestAnimationFrame(() => animationLoop(direction, callback));
};

// Unload view ImageBitmap values from memory
// View will be loaded again when needed since images will be cached in the browser
const unloadView = (viewIdx) => {
  // We don't unload the view if we are skipping animations because there
  // are not a lot of views anyways and because we are not loading them on demand.
  // Unloading views will break mobile experience since all views are preloaded.
  if (skipAnimation) return;

  viewState.value[viewIdx].frames.forEach(frame => frame.cachedImageData = null);
  viewState.value[viewIdx].loaded = false;
}

// External functions to be called from parent component
const next = (callback) => {
  unloadView(
    wrapIndex(currentViewIndex.value - 1, viewState.value.length)
  );
  const nextIndex = wrapIndex(currentViewIndex.value + 1, viewState.value.length);
  frameIndex.value = 0;
  animationLoop(1, () => {
    currentViewIndex.value = nextIndex;
    frameIndex.value = 0;
    drawImage(viewState.value[currentViewIndex.value]?.frames?.[0]?.cachedImageData);
    if (callback) callback(currentViewIndex.value);
  });
};

const prev = (callback) => {
  unloadView(
    currentViewIndex.value
  );
  const prevIndex = wrapIndex(currentViewIndex.value - 1, viewState.value.length);
  currentViewIndex.value = prevIndex;
  frameIndex.value = viewState.value[currentViewIndex.value]?.frames?.length - 1 || 0;
  drawImage(viewState.value[currentViewIndex.value]?.frames?.[frameIndex.value]?.cachedImageData);
  animationLoop(-1, () => {
    frameIndex.value = 0;
    drawImage(viewState.value[currentViewIndex.value]?.frames?.[0]?.cachedImageData);
    if (callback) callback(currentViewIndex.value);
  });
};

onBeforeUnmount(() => {
  // Clean up the resize observer
  if (resizeObserver.value && container.value) {
    resizeObserver.value.unobserve(container.value);
    resizeObserver.value.disconnect();
  }

  // Cancel any ongoing animations
  if (animationRequestId.value) {
    cancelAnimationFrame(animationRequestId.value);
  }

  mapAnimationStore.addCanvasState(srcKey.value, {
    'currentViewIndex': currentViewIndex.value
  });
});

defineExpose({
  next,
  prev,
});
</script>

<template>
  <div
    ref="container"
    class="tw-inset-0 tw-w-full tw-h-full tw-fixed tw-top-0 tw-left-0 tw-overflow-hidden"
  >
    <zoom-wrapper-alt ref="zoomWrapper" :width="canvasSize.width" @on-zoom="onZoom">
      <canvas ref="canvas"/>
      <canvas
        ref="transitionCanvas"
        class="tw-absolute tw-top-0 tw-left-0 tw-pointer-events-none tw-hidden tw-z-10"
      />

      <div
        v-if="$slots.overlay"
        ref="overlay"
        class="tw-absolute tw-top-0 tw-left-0 tw-right-0 tw-bottom-0 tw-flex tw-justify-center tw-items-center"
      >
        <div
          class="tw-absolute tw-inset-0 tw-h-full tw-w-full"
          :style="{
            width: canvasSize.width > 0 ? canvasSize.width + 'px' : 'auto',
            height: canvasSize.height > 0 ? canvasSize.height + 'px' : 'auto',
            pointerEvents: 'none'
          }"
        >
          <slot name="overlay"></slot>
        </div>
      </div>
    </zoom-wrapper-alt>
  </div>
</template>

<style scoped>
/* Ensure SVG paths within overlay are clickable */
:deep(svg path) {
  pointer-events: all;
}
</style>
