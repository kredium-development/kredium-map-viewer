<script setup>
import InlineSvg from './InlineSvg.vue';
import { onMounted, ref, watch } from 'vue';

const emit = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  dropdownClass: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: null
  },
  items: {
    type: Array,
    default: null
  },
  openIcon: {
    type: String,
    default: null
  },
  closeIcon: {
    type: String,
    default: null
  },
});
const opened = ref(false);
const selectedValue = ref();

const toggle = () => opened.value = !opened.value;

onMounted(() => {
  selectedValue.value = props.modelValue;
});

watch(() => props.modelValue, (val) => {
  selectedValue.value = val;
});
</script>
<template>
  <div class="tw-relative tw-justify-center tw-rounded-lg">
    <button @click="toggle"
                    class="tw-w-full tw-flex tw-items-center tw-justify-between tw-text-sm tw-px-3 tw-py-1 tw-rounded tw-border tw-transition-all tw-border-silver tw-border-opacity-0">
        <div>
          <InlineSvg v-if="icon" :icon="props.icon" class="tw-mr-2" />
          <slot name="trigger">
            {{ selectedValue }}
          </slot>
        </div>
        <div>
          <InlineSvg v-show="!opened" :icon="props.openIcon ?? 'chevron_down'" />
          <InlineSvg v-show="opened" :icon="props.closeIcon ?? 'chevron_up'" />
        </div>
    </button>

    <div v-show="opened"
      :class="`${dropdownClass ? dropdownClass : 'tw-bg-white tw-text-dark tw-flex tw-flex-col tw-gap-2 tw-min-w-full tw-border'} tw-absolute tw-top-full tw-right-0 tw-mt-1 tw-p-3 tw-rounded-lg`">
      <slot name="dropdown">
        <button v-for="item in props.items ?? []"
          :key="item.value"
          :class="selectedValue === item.value ? 'tw-bg-[#DADADA] tw-text-[#5C4C37] tw-rounded' : ''"
          @click="selectedValue = item.value; emit('update:modelValue', item.value); toggle()">
          {{ item.label }}
        </button>
      </slot>
    </div>
  </div>
</template>
