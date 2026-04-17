
<script setup>
import {ref} from "vue";
import GalleryCarousel from "@/components/GalleryCarousel.vue";
import ModalLayout from "./ModalLayout.vue";

const project = ref();

const target = ref(false);
const gallery = ref();
const isModalOpened = ref(false);

const open = (pr) => {
  project.value = pr;
  isModalOpened.value = true;
}

const closeModal = () => {
  isModalOpened.value = false;
}

const openGallery = (i) => {
  gallery.value.open(i);
};

defineExpose({
  open
});
</script>

<template>
  <ModalLayout v-if="project" :is-open="isModalOpened" :transparent-overlay="true" @modal-close="closeModal">
    <div
      class="tw-absolute tw-right-0 tw-h-full tw-bottom-0 tw-z-30 tw-overflow-y-auto tw-space-y-6 tw-p-4 tw-w-[470px] tw-max-w-full"
      ref="target"
    >
      <div
        class="tw-bg-[#232323] tw-bg-opacity-85 tw-p-4 tw-rounded-lg tw-h-full tw-text-white tw-space-y-4 tw-overflow-x-auto"
      >
        <div class="tw-flex tw-items-center">
          <span class="tw-font-semibold tw-text-xl">{{ project.name }}</span>
          <button class="tw-ml-auto" @click.prevent="closeModal">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16.6667 1.3335L1.33337 16.6668"
                stroke="white"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M1.33337 1.3335L16.6667 16.6668"
                stroke="white"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>

        <div class="tw-space-y-4">
          <figure class="tw-rounded-lg tw-w-full tw-h-[220px] tw-overflow-hidden">
            <img
              :src="project.images[0].filename"
              :alt="project.name"
              loading="lazy"
              class="tw-w-full tw-h-full tw-object-cover"
            />
          </figure>

          <div v-html="project.description"></div>
        </div>

        <div v-if="project.gallery_images?.length > 0">
          <span class="tw-font-semibold tw-mt-4 tw-flex tw-items-center tw-gap-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1.5737 17.5C0.9807 17.5 0.5 17.0193 0.5 16.4263V1.57373C0.5 0.98073 0.9807 0.5 1.5737 0.5H16.4263C17.0193 0.5 17.5 0.98073 17.5 1.57373"
                stroke="#E5E5E5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M7.5 8.5C8.05228 8.5 8.5 8.05228 8.5 7.5C8.5 6.94772 8.05228 6.5 7.5 6.5C6.94772 6.5 6.5 6.94772 6.5 7.5C6.5 8.05228 6.94772 8.5 7.5 8.5Z"
                stroke="#E5E5E5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M2.5 15.4226L5.21329 12.7095C5.62019 12.3026 6.27978 12.3026 6.68668 12.7095L8.95001 14.9727"
                stroke="#E5E5E5"
                stroke-linejoin="round"
              />
              <path
                d="M6.46094 17.4612L14.2129 9.70947C14.6198 9.30257 15.2794 9.30257 15.6863 9.70947L19.4996 13.5227"
                stroke="#E5E5E5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M18.4263 2.5H3.5737C2.98071 2.5 2.5 2.98074 2.5 3.57373V18.4263C2.5 19.0193 2.98071 19.5 3.5737 19.5H18.4263C19.0193 19.5 19.5 19.0193 19.5 18.4263V3.57373C19.5 2.98074 19.0193 2.5 18.4263 2.5Z"
                stroke="#E5E5E5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Gallery
          </span>

          <div
            class="tw-overflow-x-scroll tw-w-full tw-mt-3 tw-flex tw-gap-4"
          >
            <figure
              v-for="(image, i) in project.gallery_images"
              :key="image.id"
              @click="openGallery(i)"
              class="tw-cursor-pointer tw-w-[272px] tw-h-[154px] tw-flex-shrink-0 tw-rounded tw-border tw-border-silver tw-border-opacity-30 tw-overflow-hidden"
            >
              <img
                :src="image.filename"
                alt=""
                class="tw-w-full tw-h-full tw-object-cover"
              />
            </figure>
          </div>
        </div>
      </div>


      <GalleryCarousel
        ref="gallery"
        :images="project.gallery_images"
      />
    </div>
  </ModalLayout>
</template>
