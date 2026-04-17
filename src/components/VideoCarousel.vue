<script setup>
import '@justinribeiro/lite-youtube';
import ClickOutside from "@/components/ClickOutside.vue";
import { ref, watch, toRefs } from "vue";

const props = defineProps({
  videoLink: { type: String, required: false },
  thumbnailList: { type: Array, required: false },
});

const { videoLink, thumbnailList } = toRefs(props);

const showGallery = ref(false);
const activeVideo = ref(null);

const youTubeIdRegex =
/(?:youtube\.com\/(?:.*v=|v\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

const closeGallery = () => {
  showGallery.value = false;
  activeVideo.value = null;
};

const setNewLink = (link) => {
if (!link) { activeVideo.value = null; return; } // guard
  const match = link.match(youTubeIdRegex);
  activeVideo.value = match ? match[1] : null;
};

const open = () => {
  if (!activeVideo.value) setNewLink(videoLink.value);
  showGallery.value = true;
};

watch(videoLink, (val) => setNewLink(val), { immediate: true });

defineExpose({ open });
</script>

<template>
  <div
    v-if="showGallery"
    class="tw-bg-[#232323] tw-fixed tw-bg-opacity-45 md:tw-p-5 tw-w-full tw-top-0 tw-h-full !tw-m-0 tw-left-0 tw-z-[9999] tw-items-center tw-flex-col">
    <ClickOutside @close="closeGallery" class="tw-h-full tw-flex tw-items-center">
      <div class="tw-max-w-[1170px] tw-w-full tw-mx-auto tw-relative max-md:tw-p-0">
        <div class="tw-flex tw-justify-end md:tw-sticky md:tw-top-5 tw-z-10 max-md:tw-px-5 max-md:tw-pt-5 tw-mb-2">
          <button @click.prevent="closeGallery"
                  class="tw-cursor-pointer tw-ml-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19 5L5 19" stroke="#E5E5E5" stroke-width="1.5" stroke-linecap="square"/>
              <path d="M5 5L19 19" stroke="#E5E5E5" stroke-width="1.5" stroke-linecap="square"/>
            </svg>
          </button>
        </div>

        <div class="tw-relative tw-w-full tw-h-fit tw-mb-4 tw-rounded-lg tw-overflow-hidden tw-border tw-border-white">
          <lite-youtube v-if="activeVideo" class="tw-h-fit" :videoid="activeVideo" autopause nocookie></lite-youtube>
        </div>

        <div v-if="thumbnailList && thumbnailList.length > 0" class="md:tw-sticky md:tw-bottom-5 tw-z-10 tw-flex tw-flex-wrap tw-gap-2">
          <button v-for="item in thumbnailList"
                  :key="item.id" class="tw-bg-[#232323] tw-text-white tw-text-sm tw-border tw-border-transparent hover:tw-border-white tw-rounded-lg tw-px-3 tw-py-2"
                  @click="setNewLink(item.link)">
            {{ item.name }}
          </button>
        </div>
      </div>
    </ClickOutside>
  </div>
</template>
