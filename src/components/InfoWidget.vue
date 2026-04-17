<script setup>
import {ref} from "vue";
import ProjectInfo from "@/components/modals/ProjectInfo.vue";
import InlineSvg from "./InlineSvg.vue";

const { project } = defineProps({
  project: {
    type: Object,
    required: true,
  },
});

const projectInfo = ref();

const openModal = (project) => {
  projectInfo.value.open(project);
};

defineExpose({
  openModal,
});
</script>

<template>
  <div>
    <button
      class="tw-bg-white hover:tw-bg-[#232323] tw-transition hover:tw-bg-opacity-45 tw-group tw-outline-none tw-ml-auto tw-bg-opacity-50 tw-rounded-full tw-w-10 lg:tw-w-12 tw-h-10 lg:tw-h-12 tw-flex tw-items-center tw-justify-center"
      @click.prevent="() => openModal(project)"
    >
    <InlineSvg icon="info" class="group-hover:tw-scale-[1.2] tw-transition" />
    </button>

    <ProjectInfo ref="projectInfo" />
  </div>
</template>
