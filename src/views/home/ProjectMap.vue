<script setup>
import {computed, onMounted, ref, watch} from "vue";
import InfoWidget from "@/components/InfoWidget.vue";
import FilterCard from "@/components/filter/FilterCard.vue";
import FilterIcon from "@/components/icons/FilterIcon.vue";
import ProjectView from "@/components/complex/ProjectView.vue";
import ProjectService from "@/api/services/Project";
import {useRoute} from "vue-router";
import OptionsWidget from "@/components/OptionsWidget.vue";
import GalleryCarousel from "@/components/GalleryCarousel.vue";
import VideoCarousel from "@/components/VideoCarousel.vue";
import {useSettingsStore} from "@/stores/settingsStore";
import ExchangeDisclaimer from "@/components/ExchangeDisclaimer.vue";
import SiteSettings from "@/components/SiteSettings.vue";

const route = useRoute();

const showFilter = ref(false)
const complex = ref();
const breadcrumbs = ref();
const embedUuid = ref(route.params.embedUuid);
const subProjectUuid = ref(route.params.subProjectUuid);
const infoWidget = ref();
const gallery = ref();
const threeSixtyLink = ref('');
const amenityGallery = ref();
const amenityImages = ref();
const media360 = ref();
const videoLink = ref();
const videoGallery = ref();
const acceptSettingsUpdate = ref(true);
const hasUnits = computed(() => {
  return complex.value && (complex.value.buildings ?? []).some(building => {
    return (building.units ?? []).length > 0;
  });
});

const currency = computed(() => {
  let currency = null;
  const buildings = complex.value?.buildings ?? [];
  for(let i = 0; i < buildings.length; i++) {
    if((buildings[i].units ?? []).length > 0) {
      currency = buildings[i].units[0].real_price_currency_code;
      break;
    }
  }
  return currency;
});
const settingsStore = useSettingsStore();

const svgDataIdCount = ref(0);

const hasNightImages = computed(() => complex.value?.images_night && complex.value?.images_night.length > 0);

const onSettingsChanged = (_new, old) => {
  if(old !== null && acceptSettingsUpdate.value) {
    acceptSettingsUpdate.value = false;
    loadComplex(true);
  }
};
watch(() => settingsStore.getCurrency, onSettingsChanged);
watch(() => settingsStore.getMeasurement, onSettingsChanged);

const toggleFilter = () => {
  showFilter.value = !showFilter.value;
};

const openVideoCarrousel = (i) => {
  videoLink.value = i;
  videoGallery.value.open()
}

const openCarrousel = (i) => {
  threeSixtyLink.value = i;
  gallery.value.open()
}

const openAmenity = (i) => {
  amenityImages.value = i;
  amenityGallery.value.open(0)
}

const getMedia360 = (media) => {
  media360.value = media;
}

const loadComplex = (keepSettings = false) => {
  acceptSettingsUpdate.value = false;
  if (!keepSettings) {
    // Clear stale currency/measurement so the first request doesn't send
    // headers that the new project embed may not support (causes 400).
    settingsStore.setDefaults(null, null);
  }

  (new ProjectService).show(embedUuid.value, subProjectUuid.value)
    .then(res => {
      complex.value = res.data.project;
      breadcrumbs.value = res.data.breadcrumbs;
      const firstUnit = (complex.value.buildings ?? []).find(b => (b.units ?? []).length > 0)?.units[0];
      if(firstUnit) {
        settingsStore.setDefaults(firstUnit.price_currency_code, firstUnit.area_unit);
      }
      settingsStore.setAvailableCurrencies(res.data.currencies);
      settingsStore.setAvailableMeasurements(res.data.measurement_units);
    })
    .finally(() => acceptSettingsUpdate.value = true);
}

const bottomClass = computed(() => svgDataIdCount.value > 1 ? 'tw-bottom-[76px]' : 'tw-bottom-3')

watch(() => route.params.subProjectUuid, () => {
  subProjectUuid.value = route.params.subProjectUuid;
  loadComplex();
})

onMounted(() => {
  loadComplex();
})
</script>

<template>
  <main v-if="complex" class="tw-p-2 md:tw-pt-3 md:tw-pb-6 md:tw-px-6 tw-mx-auto">
    <header
      class="tw-flex tw-gap-2 tw-items-center tw-justify-between tw-z-10 tw-mb-1 md:tw-mb-4"
      :class="{'max-md:tw-pr-[52px]': hasNightImages}">

      <div class="tw-hidden tw-justify-center tw-w-[52px] tw-h-10 lg:tw-h-[52px] tw-items-center tw-relative tw-z-10 tw-p-3 tw-bg-[#232323] tw-bg-opacity-85 tw-rounded-lg">
<!--        Logo-->
      </div>

      <div class="max-md:tw-hidden tw-justify-center tw-bg-[#232323] tw-bg-opacity-85 tw-flex tw-items-center tw-relative tw-z-10 tw-p-3 tw-py-2 tw-rounded-lg tw-h-10 lg:tw-h-[52px]">
        <!-- <div v-if="showFullHeader"> -->
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
        <!-- </div> -->

        <span class="tw-text-sm tw-text-secondary-dark tw-bg-secondary-white tw-px-3 tw-py-1 tw-rounded">
          {{ complex.name }}
        </span>

<!--        <button v-if="complex.child_projects.length > 1" @click.prevent="showFullHeader = !showFullHeader" class="tw-px-1 tw-ml-2 tw-py-1.5 tw-rounded tw-bg-white tw-bg-opacity-0 hover:tw-bg-opacity-10">-->
<!--          <svg :class="[showFullHeader ? 'tw-rotate-180' : null]" class="tw-transition-all" width="10" height="18" viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg">-->
<!--            <path d="M1.40039 1.3999L8.31926 8.32109C8.69406 8.69597 8.69406 9.30383 8.31926 9.67871L1.40039 16.5999" stroke="#EDEDED" stroke-linecap="round" stroke-linejoin="round"/>-->
<!--          </svg>-->
<!--        </button>-->
      </div>

      <SiteSettings />

    </header>
    <div class="tw-relative tw-flex tw-items-start tw-gap-7">

      <!-- Filter -->
      <FilterCard
        v-if="complex && complex.child_projects.length === 0 && hasUnits  && svgDataIdCount > 1"
        :complex="complex"
        @close="showFilter = false"
        :is-open="showFilter"
      />

      <div v-if="complex && complex.child_projects.length === 0 && hasUnits && svgDataIdCount > 1"
           class="md:tw-hidden tw-fixed tw-bottom-0 tw-flex tw-right-0 tw-w-full tw-z-[9]">
        <div class="tw-bg-[#232323] tw-flex tw-justify-center tw-items-center tw-bg-opacity-85 max-md:tw-overflow-x-scroll max-md:tw-items-center tw-w-full tw-relative tw-z-10 tw-px-4 tw-py-3">
          <button  class="lg:tw-hidden tw-flex tw-items-center tw-py-2 tw-px-3"
                   @click.stop="toggleFilter">
            <FilterIcon />

            <span class="tw-ml-2 tw-text-secondary-white">Filters</span>
          </button>
        </div>
      </div>

      <div v-if="complex">
        <ProjectView
          :complex="complex"
          @svg-count="(count) => svgDataIdCount = count"
          @current-media360="(media) => getMedia360(media)"
          @open-gallery="(i) => openCarrousel(i)"
          @open-amenity-gallery="(i) => openAmenity(i)"
          @open-project-info="(b) => infoWidget.openModal(b)" />
      </div>
    </div>

    <InfoWidget v-if="complex" :project="complex" ref="infoWidget" />

    <ExchangeDisclaimer
      v-if="complex && complex.child_projects.length === 0 && hasUnits && currency"
      :bottom-class="bottomClass"
      :currency="currency"

    />

    <OptionsWidget
      @open-gallery="(i) => openCarrousel(i)"
      @open-amenity-gallery="(i) => openAmenity(i)"
      @open-video-gallery="(i) => openVideoCarrousel(i)"
      :project="complex"
      :bottom-class="bottomClass"
    />

    <GalleryCarousel
      :iframeLink="threeSixtyLink"
      ref="gallery"
    />

    <GalleryCarousel
      :images="amenityImages"
      ref="amenityGallery"
    />

    <VideoCarousel
      :video-link="videoLink"
      :thumbnail-list="complex?.video_links"
      ref="videoGallery"
    />
  </main>
</template>

<style lang="scss" scoped></style>
