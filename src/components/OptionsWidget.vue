<script setup>
import {computed, onMounted, onUnmounted, ref} from "vue";
import InfoWidget from "@/components/InfoWidget.vue";
const emit = defineEmits(['open-gallery', 'open-video-gallery', 'open-amenity-gallery']);

const { project, bottomClass } = defineProps({
  project: {
    type: Object,
    required: true,
  },
  bottomClass: {
    type: String,
    required: false,
    default: 'tw-bottom-[76px]'
  }
});

const showAmenities = ref(false);
const showThreeSixty = ref(false);
const showVideos = ref(false);
const dropdownRef = ref(null);
const threeSixtyDropdownRef = ref(null);
const videoDropdownRef = ref(null);

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    showAmenities.value = false;
  }

  if (threeSixtyDropdownRef.value && !threeSixtyDropdownRef.value.contains(event.target)) {
    showThreeSixty.value = false;
  }

  if (videoDropdownRef.value && !videoDropdownRef.value.contains(event.target)) {
    showVideos.value = false;
  }
}

const hasMedia360 = computed(() =>
  project.images.some(
    img => Array.isArray(img.media360) && img.media360.length > 0
  )
)

const openGallery = (i) => {
  emit('open-gallery', i);
};

const openVideoGallery = (i) => {
  emit('open-video-gallery', i);
};

const openAmenityGallery = (i) => {
  emit('open-amenity-gallery', i);
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div
    class="tw-fixed max-lg:tw-grid max-lg:tw-gap-2 md:tw-bottom-6 tw-right-[8px] lg:tw-right-6 tw-flex tw-items-end tw-gap-3.5 tw-z-20"
    :class="bottomClass"
  >

    <div v-if="project.video_links?.length > 0"
         class="tw-flex tw-flex-col tw-items-end" ref="videoDropdownRef">
      <div
        class="custom-scroll tw-max-h-[336px] tw-overflow-auto tw-grid tw-gap-2 tw-min-w-[135px]  tw-absolute tw-bottom-[194px] lg:tw-bottom-[56px]"
        :class="{'tw-opacity-100': showVideos}" v-if="showVideos"
      >

        <figure v-for="video in project.video_links" @click.prevent="openVideoGallery(video.link)" :key="video.id"
                class="tw-flex tw-w-[172px] tw-h-[96px] tw-relative tw-group tw-overflow-hidden tw-cursor-pointer tw-rounded tw-text-secondary-white tw-border tw-border-silver tw-border-opacity-30">
          <img class="tw-w-full tw-h-full tw-object-cover" :src="video.image" :alt="video.name">

          <figcaption class="tw-absolute tw-z-10 hover:tw-opacity-0 tw-left-2 tw-bottom-2 group-hover:tw-hidden">
            {{ video.name }}
          </figcaption>

          <figcaption class="tw-absolute -tw-z-10 tw-transition-all tw-opacity-0 group-hover:tw-z-20 group-hover:tw-opacity-100 tw-left-0 tw-flex tw-items-center tw-justify-center tw-bottom-0 tw-w-full tw-h-full tw-bg-[#282828] tw-bg-opacity-85">
            <svg width="38" height="26" viewBox="0 0 38 26" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M34.4206 5.11909L29.4595 8.42686C29.2203 8.58652 28.8999 8.41479 28.8999 8.12715V3.45972C28.8999 2.26686 27.9327 1.2998 26.7399 1.2998H4.05992C2.86705 1.2998 1.8999 2.26686 1.8999 3.45972V22.5399C1.8999 23.7328 2.86705 24.6998 4.05992 24.6998H26.7399C27.9327 24.6998 28.8999 23.7328 28.8999 22.5399V17.8725C28.8999 17.5848 29.2203 17.4131 29.4595 17.5728L34.4209 20.8805C35.1385 21.359 36.0999 20.8444 36.0999 19.9818V6.01777C36.0999 5.15521 35.1385 4.64047 34.4206 5.11909V5.11909Z" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </figcaption>
        </figure>
      </div>

      <button
        @click="showVideos = !showVideos"
        class="tw-justify-center tw-flex tw-items-center tw-text-sm tw-relative tw-z-10 max-lg:tw-w-[40px] max-lg:tw-h-[40px] lg:tw-p-3 tw-rounded-lg tw-border tw-border-silver tw-border-opacity-0 hover:tw-border-opacity-30"
        :class="[
        showVideos ? 'tw-bg-[#DADADA] tw-text-secondary-dark' : 'tw-bg-[#232323] tw-bg-opacity-85 tw-text-secondary-white'
      ]">
        <span class="lg:tw-hidden">
          <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M22.2801 3.74639L18.9727 5.95156C18.8132 6.058 18.5996 5.94352 18.5996 5.75176V2.64014C18.5996 1.8449 17.9548 1.2002 17.1596 1.2002H2.03962C1.24437 1.2002 0.599609 1.8449 0.599609 2.64014V15.3603C0.599609 16.1555 1.24437 16.8002 2.03962 16.8002H17.1596C17.9548 16.8002 18.5996 16.1555 18.5996 15.3603V12.2486C18.5996 12.0569 18.8132 11.9424 18.9727 12.0488L22.2802 14.254C22.7587 14.573 23.3996 14.2299 23.3996 13.6549V4.34551C23.3996 3.77047 22.7587 3.42731 22.2801 3.74639V3.74639Z" :stroke="showVideos ? '#5C4C37' : '#C5C5C5'" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>

        <span class="max-lg:tw-hidden tw-flex tw-items-center tw-gap-2">
          Videos
          <span class="tw-pl-2.5">
            <svg :class="showVideos ? 'tw-rotate-180' : null" width="10" height="5" viewBox="0 0 10 5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.833984 4.66667L5.00065 0.5L9.16732 4.66667H0.833984Z" :fill="showVideos ? '#595959' : 'white'"/>
            </svg>
          </span>
        </span>
      </button>
    </div>

    <div
      v-if="hasMedia360"
      class="tw-flex tw-flex-col tw-items-end" ref="threeSixtyDropdownRef">

        <div
          class="custom-scroll tw-max-h-[336px] tw-overflow-auto tw-grid tw-gap-2 tw-absolute tw-bottom-[144px] lg:tw-bottom-[56px] tw-z-10 tw-min-w-[135px]"
          :class="{'tw-opacity-100': showThreeSixty}" v-if="showThreeSixty"
        >
          <template v-for="image in project.images">
            <figure v-for="threeSixty in image.media360" :key="threeSixty.id" @click.prevent="openGallery(threeSixty.link)"
                    class="tw-flex tw-w-[172px] tw-h-[96px] tw-relative tw-group tw-overflow-hidden tw-cursor-pointer tw-rounded tw-text-secondary-white tw-border tw-border-silver tw-border-opacity-30">
              <img class="tw-w-full tw-h-full tw-object-cover" :src="threeSixty.image" alt="">

              <div class="tw-absolute tw-w-full tw-bottom-0 tw-left-0 tw-bg-gradient-to-t tw-from-black/65 tw-h-12 tw-to-transparent tw-z-0"></div>

              <figcaption class="tw-absolute tw-z-10 hover:tw-opacity-0 tw-left-2 tw-bottom-2 group-hover:tw-hidden">{{ threeSixty.name }}</figcaption>

              <figcaption class="tw-absolute -tw-z-10 tw-transition-all tw-opacity-0 group-hover:tw-z-20 group-hover:tw-opacity-100 tw-left-0 tw-flex tw-items-center tw-justify-center tw-bottom-0 tw-w-full tw-h-full tw-bg-[#282828] tw-bg-opacity-85">
                <svg width="47" height="32" viewBox="0 0 47 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M45 17.3657C45 22.7528 35.1503 27.12 23 27.12C10.8497 27.12 1 22.7528 1 17.3657" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M31.6055 14.3205C33.8189 14.3205 35.6133 12.5261 35.6133 10.3127V5.00783C35.6133 2.79437 33.8189 1 31.6055 1C29.392 1 27.5977 2.79437 27.5977 5.00783V10.3127C27.5977 12.5261 29.392 14.3205 31.6055 14.3205Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M15.4453 10.3319L15.4721 8.41234C15.5221 4.83001 18.0545 1.76354 21.5628 1.03711" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M15.4453 10.4078C15.4453 12.567 17.1291 14.3175 19.2062 14.3175C21.2834 14.3175 22.9671 12.567 22.9671 10.4078C22.9671 8.24848 21.2834 6.49805 19.2062 6.49805C17.1291 6.49805 15.4453 8.24848 15.4453 10.4078Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M6.79778 7.52344C9.02437 7.52344 10.8298 9.0512 10.8298 10.9265C10.8298 12.8002 9.02521 14.3195 6.79862 14.3195C5.04633 14.3195 3.55526 13.3785 3 12.0643" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M3.36719 3.11542C3.88172 1.8992 5.18192 1.03711 6.70598 1.03711C8.68246 1.03711 10.2831 2.48829 10.2831 4.2803C10.2831 6.07231 8.68246 7.52517 6.70598 7.52517" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M6.70452 7.52344H5.90234" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M45.3799 3.64114C45.3799 5.09973 44.1974 6.28228 42.7388 6.28228C41.2802 6.28228 40.0977 5.09973 40.0977 3.64114C40.0977 2.18256 41.2802 1 42.7388 1C44.1974 1 45.3799 2.18256 45.3799 3.64114Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M22.7383 23.4028L26.1911 26.9658L22.6281 30.4187" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </figcaption>
            </figure>
          </template>
        </div>

      <button
        @click="showThreeSixty = !showThreeSixty"
        class="tw-justify-center tw-flex tw-items-center tw-text-sm tw-relative tw-z-10 max-lg:tw-w-[40px] max-lg:tw-h-[40px] lg:tw-p-3 tw-rounded-lg tw-border tw-border-silver tw-border-opacity-0 hover:tw-border-opacity-30"
        :class="[
        showThreeSixty ? 'tw-bg-[#DADADA] tw-text-secondary-dark' : 'tw-bg-[#232323] tw-bg-opacity-85 tw-text-secondary-white'
      ]">
        <span class="lg:tw-hidden">
          <svg width="24" height="17" viewBox="0 0 24 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M23 9.18262C23 11.8762 18.0751 14.0597 12 14.0597C5.92487 14.0597 1 11.8762 1 9.18262" :stroke="showThreeSixty ? '#5C4C37' : '#C5C5C5'" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M16.3027 7.66025C17.4095 7.66025 18.3067 6.76306 18.3067 5.65633V3.00391C18.3067 1.89718 17.4095 1 16.3027 1C15.196 1 14.2988 1.89718 14.2988 3.00391V5.65633C14.2988 6.76306 15.196 7.66025 16.3027 7.66025Z" :stroke="showThreeSixty ? '#5C4C37' : '#C5C5C5'" stroke-width="1.42916" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8.22266 5.66597L8.23604 4.70617C8.26103 2.915 9.52724 1.38177 11.2814 1.01855" :stroke="showThreeSixty ? '#5C4C37' : '#C5C5C5'" stroke-width="1.42916" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8.22266 5.70388C8.22266 6.78351 9.06455 7.65873 10.1031 7.65873C11.1417 7.65873 11.9836 6.78351 11.9836 5.70388C11.9836 4.62424 11.1417 3.74902 10.1031 3.74902C9.06455 3.74902 8.22266 4.62424 8.22266 5.70388Z" :stroke="showThreeSixty ? '#5C4C37' : '#C5C5C5'" stroke-width="1.42916" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3.89889 4.26172C5.01218 4.26172 5.91492 5.0256 5.91492 5.96326C5.91492 6.90008 5.0126 7.65976 3.89931 7.65976C3.02316 7.65976 2.27763 7.18924 2 6.53215" :stroke="showThreeSixty ? '#5C4C37' : '#C5C5C5'" stroke-width="1.42916" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M2.18359 2.05771C2.44086 1.4496 3.09096 1.01855 3.85299 1.01855C4.84123 1.01855 5.64155 1.74414 5.64155 2.64015C5.64155 3.53616 4.84123 4.26259 3.85299 4.26259" :stroke="showThreeSixty ? '#5C4C37' : '#C5C5C5'" stroke-width="1.42916" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M3.85226 4.26172H3.45117" :stroke="showThreeSixty ? '#5C4C37' : '#C5C5C5'" stroke-width="1.42916" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M23.19 2.32057C23.19 3.04986 22.5987 3.64114 21.8694 3.64114C21.1401 3.64114 20.5488 3.04986 20.5488 2.32057C20.5488 1.59128 21.1401 1 21.8694 1C22.5987 1 23.19 1.59128 23.19 2.32057Z" :stroke="showThreeSixty ? '#5C4C37' : '#C5C5C5'" stroke-width="1.42916" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M11.8691 12.2012L13.5956 13.9827L11.8141 15.7091" :stroke="showThreeSixty ? '#5C4C37' : '#C5C5C5'" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>

        </span>

        <span class="max-lg:tw-hidden tw-flex tw-items-center tw-gap-2">
          360 View
          <span class="tw-pl-2.5">
            <svg :class="showThreeSixty ? 'tw-rotate-180' : null" width="10" height="5" viewBox="0 0 10 5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.833984 4.66667L5.00065 0.5L9.16732 4.66667H0.833984Z" :fill="showThreeSixty ? '#595959' : 'white'"/>
            </svg>
          </span>
        </span>
      </button>
    </div>

    <div v-if="project?.amenities?.length > 0" ref="dropdownRef" class="tw-flex tw-flex-col tw-relative tw-items-end">
      <div
        class="tw-grid tw-absolute custom-scroll tw-max-h-[336px] tw-overflow-auto tw-z-[99] tw-bottom-[48px] lg:tw-bottom-[56px] tw-right-0 tw-gap-2 tw-min-w-[135px] tw-transition-all"
        :class="showAmenities ? 'tw-opacity-100' : 'tw-opacity-0'" v-if="showAmenities">

        <span v-for="amenity in project.amenities" :key="amenity.id"
              :class="amenity.image ? 'tw-cursor-pointer hover:tw-border-silver hover:tw-border-opacity-70' : 'tw-border-opacity-0'"
              class="tw-flex tw-cursor-default tw-group tw-gap-2 tw-items-center tw-text-sm tw-rounded-lg tw-bg-[#232323] tw-bg-opacity-85 tw-text-secondary-white tw-px-3 tw-py-2 tw-border tw-border-silver tw-border-opacity-0"
              @click.prevent="amenity.images.length > 0 ? openAmenityGallery(amenity.images) : null"
        >
          <span class="tw-hidden">
            {{ amenity.icon }}
          </span>
          {{ amenity.name }}

          <span v-if="amenity.images.length > 0" class="tw-ml-auto">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path class="group-hover:tw-stroke-white" d="M4.8998 5.50005C5.23118 5.50005 5.4998 5.23142 5.4998 4.90005C5.4998 4.56868 5.23118 4.30005 4.8998 4.30005C4.56843 4.30005 4.2998 4.56868 4.2998 4.90005C4.2998 5.23142 4.56843 5.50005 4.8998 5.50005Z" stroke="#A7A7A7" stroke-linecap="round" stroke-linejoin="round"/>
              <path class="group-hover:tw-stroke-white" d="M1.2998 10.2535L3.52778 8.02563C3.77192 7.78149 4.16768 7.78149 4.41182 8.02563L5.7698 9.38354" stroke="#A7A7A7" stroke-linejoin="round"/>
              <path class="group-hover:tw-stroke-white" d="M4.27637 10.8767L8.92757 6.22571C9.17171 5.98157 9.56747 5.98157 9.81161 6.22571L12.6996 9.11365" stroke="#A7A7A7" stroke-linecap="round" stroke-linejoin="round"/>
              <path class="group-hover:tw-stroke-white" d="M11.9798 1.30005H2.0198C1.62216 1.30005 1.2998 1.62237 1.2998 2.02002V11.9801C1.2998 12.3777 1.62216 12.7 2.0198 12.7H11.9798C12.3775 12.7 12.6998 12.3777 12.6998 11.9801V2.02002C12.6998 1.62237 12.3775 1.30005 11.9798 1.30005Z" stroke="#A7A7A7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </span>
      </div>

      <button
        @click="showAmenities = !showAmenities"
        class="tw-justify-center tw-flex tw-items-center tw-text-sm tw-relative tw-z-10 max-lg:tw-w-[40px] max-lg:tw-h-[40px] lg:tw-p-3 tw-rounded-lg tw-border tw-border-silver tw-border-opacity-0 hover:tw-border-opacity-30"
      :class="[
        showAmenities ? 'tw-bg-[#DADADA] tw-text-secondary-dark' : 'tw-bg-[#232323] tw-bg-opacity-85 tw-text-secondary-white'
      ]">
        <span class="lg:tw-hidden">
          <svg width="26" height="24" viewBox="0 0 26 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.625 11.8867C9.64788 7.95656 11.5844 4.38494 12.5133 2.89596C12.7387 2.53468 13.2608 2.53468 13.4862 2.89596C14.4151 4.38493 16.3517 7.95653 16.3746 11.8866" :stroke="showAmenities ? '#5C4C37' : '#C5C5C5'" stroke-linejoin="round"/>
            <path d="M23.8767 7.15109C22.2963 7.63596 18.6938 9.0144 16.2406 12.0496C13.0184 16.0377 13 21.375 13 21.375C13 21.375 18.206 20.247 21.4284 16.2597C23.8815 13.2237 24.4778 9.40626 24.6227 7.75608C24.6587 7.34591 24.27 7.03023 23.8767 7.15108V7.15109Z" :stroke="showAmenities ? '#5C4C37' : '#C5C5C5'" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M9.75932 12.0496C7.3062 9.0144 3.70369 7.63595 2.12321 7.15108C1.73004 7.03023 1.34126 7.34591 1.37733 7.75608C1.52221 9.40626 2.11845 13.2237 4.57156 16.2597C7.79394 20.2471 13 21.375 13 21.375C13 21.375 12.9815 16.0377 9.75931 12.0496L9.75932 12.0496Z" :stroke="showAmenities ? '#5C4C37' : '#C5C5C5'" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>

        <span class="max-lg:tw-hidden tw-flex tw-items-center tw-gap-2">
          Amenities
          <span class="tw-pl-2.5">
            <svg :class="showAmenities ? 'tw-rotate-180' : null" width="10" height="5" viewBox="0 0 10 5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.833984 4.66667L5.00065 0.5L9.16732 4.66667H0.833984Z" :fill="showAmenities ? '#595959' : 'white'"/>
            </svg>
          </span>
        </span>
      </button>

    </div>

    <InfoWidget v-if="project" :project="project" ref="infoWidget" />
  </div>
</template>

<style scoped lang="scss">
</style>
