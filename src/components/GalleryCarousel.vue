<script setup>
import 'swiper/css';
import 'swiper/css/zoom';
import { computed, nextTick, ref, defineAsyncComponent } from 'vue';
// Lazy-load Swiper components to reduce initial bundle size
const Swiper = defineAsyncComponent(() => import('swiper/vue').then(m => m.Swiper));
const SwiperSlide = defineAsyncComponent(() => import('swiper/vue').then(m => m.SwiperSlide));
import { Zoom, Keyboard } from 'swiper/modules';
import '@justinribeiro/lite-youtube';
import ClickOutside from '@/components/ClickOutside.vue';

const props = defineProps({
  images: Array,
  iframeLink: String,
  type: String,
});

const showGallery = ref(false);
const activeSlide = ref(0);
const swiperRef = ref(null);
const zoomRatio = ref(1);
const loadingIframe = ref(false);

const hasIframe = computed(() => !!props.iframeLink && props.iframeLink.length > 0);
const hasImages = computed(() => Array.isArray(props.images) && props.images.length > 0);

const closeGallery = () => {
  showGallery.value = false;
  const videoElement = document.querySelector('lite-youtube');
  if (videoElement) videoElement.click();
};

const onSwiperReady = (swiper) => {
  swiperRef.value = swiper;
};

const open = (i = 0) => {
  if (!hasIframe.value && hasImages.value) {
    activeSlide.value = Math.max(0, Math.min(i, props.images.length - 1));
    nextTick(() => {
      if (swiperRef.value) swiperRef.value.slideTo(activeSlide.value, 0);
    });
    // Open immediately for image gallery
    setTimeout(() => { showGallery.value = true; }, 0);
    return;
  }

  // For iframe: indicate loading and wait a tick so the DOM applies the new src
  loadingIframe.value = true;
  nextTick(() => {
    setTimeout(() => { showGallery.value = true; }, 0);
  });
};

const onIframeLoad = () => {
  loadingIframe.value = false;
};

const nextSlide = () => {
  if (hasImages.value && activeSlide.value < props.images.length - 1 && swiperRef.value) {
    swiperRef.value.slideNext();
  }
};

const prevSlide = () => {
  if (activeSlide.value > 0 && swiperRef.value) {
    swiperRef.value.slidePrev();
  }
};

const zoomIn = () => {
  zoomRatio.value = Math.min(3, zoomRatio.value + 0.5);
  if (swiperRef.value?.zoom) swiperRef.value.zoom.in(zoomRatio.value);
};

const zoomOut = () => {
  zoomRatio.value = Math.max(1, zoomRatio.value - 0.5);
  if (swiperRef.value?.zoom) swiperRef.value.zoom.in(zoomRatio.value);
};

const isFirst = computed(() => activeSlide.value === 0);
const isLast = computed(() => (hasImages.value ? activeSlide.value === props.images.length - 1 : false));

const onSlideChange = (swiper) => {
  activeSlide.value = swiper.activeIndex ?? 0;
};

defineExpose({
  open,
});
</script>

<template>
  <div
    :class="[showGallery ? 'tw-fixed' : 'tw-hidden']"
    class="tw-bg-[#232323] tw-bg-opacity-45 md:tw-p-5 tw-w-full tw-top-0 tw-h-full !tw-m-0 tw-left-0 tw-z-[9999] tw-items-center tw-flex-col">
    <ClickOutside @close="closeGallery" class="tw-h-full tw-flex tw-items-center">
      <template v-if="hasIframe">
        <div class="tw-flex tw-justify-between tw-gap-1 tw-mb-4 max-md:tw-px-5 max-md:tw-pt-5">
          <button @click.prevent="closeGallery" class="tw-absolute tw-z-50 tw-right-0 tw-top-[32px] tw-bg-[#282828] tw-p-1 tw-cursor-pointer tw-ml-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19 5L5 19" stroke="#E5E5E5" stroke-width="1.5" stroke-linecap="square"/>
              <path d="M5 5L19 19" stroke="#E5E5E5" stroke-width="1.5" stroke-linecap="square"/>
            </svg>
          </button>
        </div>

        <iframe class="tw-w-full tw-absolute tw-aspect-video tw-h-full tw-top-0 tw-left-0 tw-object-cover tw-z-0"
                :key="props.iframeLink" :src="props.iframeLink" frameborder="0" @load="onIframeLoad"
                allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer; autoplay;"
                allowfullscreen
                allowvr="yes"
        ></iframe>

        <div v-if="loadingIframe" class="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-black/30 tw-z-[1]">
          <div class="tw-w-8 tw-h-8 tw-border-2 tw-border-white tw-border-t-transparent tw-rounded-full tw-animate-spin"></div>
        </div>
      </template>

      <template v-else-if="props.type !== 'video'">
        <div class="tw-max-w-[1170px] tw-w-full tw-mx-auto tw-flex tw-flex-col tw-align-center tw-relative max-md:tw-p-0">
          <div class="tw-flex tw-gap-1 tw-mb-4 max-md:tw-px-5 max-md:tw-pt-5 max-md:tw-w-full max-md:-tw-top-10 md:tw-sticky md:tw-top-5 tw-z-50"
          :class="{'tw-justify-between': hasImages, 'tw-justify-end': !hasImages}">
            <p class="tw-text-white" v-if="hasImages">
              <span>{{ activeSlide + 1 }}</span> / {{ props.images.length }}
            </p>

            <div class="tw-flex tw-gap-4">
              <div class="tw-flex tw-gap-2 tw-ml-auto">
                <button type="button" class="swip-zoom-in" :class="{ 'tw-opacity-30': zoomRatio >= 3 }" :disabled="zoomRatio >= 3" @click.prevent="zoomIn">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#E5E5E5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M20.9984 21.0004L16.6484 16.6504" stroke="#E5E5E5" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="round"/>
                    <path d="M11 8V14" stroke="#E5E5E5" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="round"/>
                    <path d="M8 11H14" stroke="#E5E5E5" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button type="button" class="swip-zoom-out" :class="{ 'tw-opacity-30': zoomRatio <= 1 }" :disabled="zoomRatio <= 1" @click.prevent="zoomOut">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#E5E5E5" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M20.9984 21.0004L16.6484 16.6504" stroke="#E5E5E5" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="round"/>
                    <path d="M8 11H14" stroke="#E5E5E5" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>

              <hr class="tw-hidden lg:tw-block tw-w-[1px] tw-h-[16px] tw-bg-[#E5E5E54D] tw-my-auto tw-border-t-0">

              <button @click.prevent="closeGallery" class="tw-cursor-pointer">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M19 5L5 19" stroke="#E5E5E5" stroke-width="1.5" stroke-linecap="square"/>
                  <path d="M5 5L19 19" stroke="#E5E5E5" stroke-width="1.5" stroke-linecap="square"/>
                </svg>
              </button>
            </div>
          </div>

          <template v-if="hasImages && props.images.length > 1">
            <button @click="prevSlide"
                    class="tw-absolute tw-z-50 tw-left-5 md:tw-left-0 tw-top-1/2 tw-mt-5 -tw-translate-y-1/2"
                    :class="{'tw-opacity-40 tw-pointer-events-none': isFirst}"
                    :disabled="isFirst">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="16" fill="white" fill-opacity="0.7"/>
                <path d="M19 22L13 16L19 10" stroke="#241C15" stroke-linecap="square"/>
              </svg>
            </button>

            <button @click="nextSlide" class="tw-absolute tw-z-50 tw-right-5 md:tw-right-0 tw-top-1/2 tw-mt-5 -tw-translate-y-1/2"
                    :class="{'tw-opacity-40 tw-pointer-events-none': isLast}"
                    :disabled="isLast">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="16" fill="white" fill-opacity="0.7"/>
                <path d="M13 22L19 16L13 10" stroke="#241C15" stroke-linecap="square"/>
              </svg>
            </button>
          </template>

          <div class="tw-w-full tw-h-fit tw-mx-auto tw-relative">
            <Swiper
              :modules="[Zoom, Keyboard]"
              :slides-per-view="1"
              :space-between="30"
              :zoom="true"
              :initial-slide="activeSlide"
              :keyboard="{ enabled: true }"
              :navigation="false"
              @swiper="onSwiperReady"
              @slideChange="onSlideChange"
            >
              <SwiperSlide v-for="(image, i) in props.images" :key="i" class="tw-my-auto">
                <figure class="swiper-zoom-container">
                  <img :src="image.filename" :alt="image.name" loading="lazy" class="tw-object-contain tw-mx-auto tw-aspect-video" />
                </figure>
              </SwiperSlide>
            </Swiper>
          </div>
        </div>
      </template>
    </ClickOutside>
  </div>
</template>
