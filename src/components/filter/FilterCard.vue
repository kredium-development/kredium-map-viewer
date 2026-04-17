<script setup>
import Slider from '@vueform/slider'
import { useFilterStore } from '@/stores/filterStore';
import { nextTick, ref, watch} from 'vue';
import bedroomColors from '../bedroomColors';
import { formatNumber } from '@/mixins/formatNumber';

const filterStore = useFilterStore();

const { building, complex, activeTab, isOpen } = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  hasImage: {
    type: Boolean,
    default: false,
  },
  building: {
    type: Object
  },
  complex: {
    type: Object
  },
  activeTab: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['close']);

const areaRange = ref([0, 0]);
const priceRange = ref([0, 0]);
const floorRange = ref([0, 0]);
const showFilter = ref(true)

const toggleFilter = () => {
  showFilter.value = !showFilter.value;
  if (!showFilter.value) emit('close');
}

const setActiveRoomTypes = (roomType) => {
  filterStore.updateSelectedTypes(roomType)
}

const resetFilters = () => {
  filterStore.resetFilters();
  floorRange.value = filterStore.floorRange;
  areaRange.value = filterStore.areaRange;
  priceRange.value[0] = filterStore.priceRange[0];
  priceRange.value[1] = filterStore.priceRange[1];
}

const handlePriceMinChange = async (event) => {
  const newMin = parseFloat(event.target.value.replace(/,/g, ''));

  if (newMin > priceRange.value[1]) {
    // Fallback to full range if min exceeds max
    priceRange.value[0] = filterStore.priceRange[0];
    priceRange.value[1] = filterStore.priceRange[1];

    // Force input to update its display value
    await nextTick();
    event.target.value = formatNumber(priceRange.value[0]);
  } else {
    priceRange.value[0] = newMin;
  }

  filterStore.updateSelectedPriceRange(priceRange.value);
}

const handlePriceMaxChange = async (event) => {
  const newMax = parseFloat(event.target.value.replace(/,/g, ''));

  if (newMax < priceRange.value[0]) {
    // Fallback to full range if max is less than min
    priceRange.value[0] = filterStore.priceRange[0];
    priceRange.value[1] = filterStore.priceRange[1];

    // Force input to update its display value
    await nextTick();
    event.target.value = formatNumber(priceRange.value[1]);
  } else {
    priceRange.value[1] = newMax;
  }

  filterStore.updateSelectedPriceRange(priceRange.value);
}


watch(() => building, async (newBuilding) => {
  if (newBuilding) {
    filterStore.adaptToBuilding(newBuilding);
    await nextTick();
    areaRange.value = filterStore.selectedAreaRange;
    floorRange.value = filterStore.selectedFloorRange;
    priceRange.value[0] = filterStore.priceRange[0];
    priceRange.value[1] = filterStore.priceRange[1];
  }
}, { immediate: true })

watch(() => complex, async (newComplex) => {
  if (newComplex) {
    filterStore.adaptToComplex(newComplex);
    await nextTick();
    areaRange.value = filterStore.selectedAreaRange;
    floorRange.value = filterStore.selectedFloorRange;
    priceRange.value[0] = filterStore.priceRange[0];
    priceRange.value[1] = filterStore.priceRange[1];
  }
}, { immediate: true })

watch(() => isOpen, (val) => {
  if (val) showFilter.value = true;
});
</script>

<template>
  <div
    class="tw-bg-[#232323] tw-bg-opacity-85 tw-z-50 tw-w-[258px] max-md:!tw-w-full max-md:tw-fixed max-md:tw-bottom-0 max-md:tw-transition-transform tw-transition-none tw-duration-300 tw-shrink-0 tw-left-0 md:tw-sticky md:tw-top-0 tw-p-3 tw-text-white tw-rounded-xl"
    :class="[
    showFilter ? '' : 'md:tw-w-fit md:!tw-p-0',
    isOpen ? 'max-md:tw-translate-y-0' : 'max-md:tw-translate-y-full'
  ]">
    <div class="tw-space-y-6">
      <div class="tw-space-y-2">
        <div class="tw-flex tw-justify-between tw-items-center">
          <span v-if="showFilter" class="tw-text-sm tw-text-secondary-white tw-font-semibold">Residence</span>

          <button v-if="!showFilter" @click="toggleFilter" class="tw-hidden tw-items-center tw-px-4 tw-py-3 tw-gap-3 md:tw-flex">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.907704 19.1396L9.37282 19.1396M13.931 19.1396L21.0938 19.1396" stroke="#C5C5C5" stroke-linecap="round" stroke-linejoin="round" data-v-inspector="src/components/icons/FilterIcon.vue:3:5"></path>
              <path d="M9.37155 19.1394C9.37155 20.3981 10.3919 21.4185 11.6506 21.4185C12.9093 21.4185 13.9297 20.3981 13.9297 19.1394C13.9297 17.8807 12.9093 16.8604 11.6506 16.8604C10.3919 16.8604 9.37155 17.8807 9.37155 19.1394Z" stroke="#C5C5C5" data-v-inspector="src/components/icons/FilterIcon.vue:4:5"></path>
              <path d="M0.907704 11L4.4891 11M9.04724 11L21.0938 11" stroke="#C5C5C5" stroke-linecap="round" stroke-linejoin="round" data-v-inspector="src/components/icons/FilterIcon.vue:5:5"></path>
              <path d="M4.48874 10.9998C4.48874 12.2585 5.50911 13.2788 6.76781 13.2788C8.0265 13.2788 9.04687 12.2585 9.04687 10.9998C9.04687 9.74108 8.0265 8.7207 6.76781 8.7207C5.50911 8.7207 4.48874 9.74108 4.48874 10.9998Z" stroke="#C5C5C5" data-v-inspector="src/components/icons/FilterIcon.vue:6:5"></path>
              <path d="M0.907704 2.86035L13.2798 2.86035M17.8379 2.86035L21.0938 2.86035" stroke="#C5C5C5" stroke-linecap="round" stroke-linejoin="round" data-v-inspector="src/components/icons/FilterIcon.vue:7:5"></path>
              <path d="M13.2798 2.86012C13.2798 4.11882 14.3001 5.13919 15.5588 5.13919C16.8175 5.13919 17.8379 4.11882 17.8379 2.86012C17.8379 1.60143 16.8175 0.581055 15.5588 0.581055C14.3001 0.581055 13.2798 1.60143 13.2798 2.86012Z" stroke="#C5C5C5" data-v-inspector="src/components/icons/FilterIcon.vue:8:5"></path>
            </svg>
            Filter
          </button>

          <button v-if="showFilter" @click="toggleFilter" :class="[{'tw-block md:tw-hidden': activeTab === 'plans' || activeTab === 'plate'}]">
            <svg class="tw-w-4 tw-h-4" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.7 0.5L0.5 15.7" stroke="#EDEDED" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M0.5 0.5L15.7 15.7" stroke="#EDEDED" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <template v-if="showFilter">
          <div class="tw-overflow-hidden tw-rounded-lg tw-divide-y tw-divide-[#494848] tw-grid"
               v-if="building || complex">

            <!-- ROOM TYPES-->
            <div class="tw-flex" v-for="opt in [...filterStore.roomTypes]" :key="opt">
              <input :id="`bedrooms-${opt}`" :checked="filterStore.selectedTypes.has(opt)"
                     @input="setActiveRoomTypes(opt)" type="checkbox" class="tw-hidden" />
              <label :for="`bedrooms-${opt}`"
                     :style="filterStore.selectedTypes.has(opt) ? `background-color: ${bedroomColors[complex ? 1 : opt]}` : ''"
                     class="tw-text-sm tw-cursor-pointer tw-w-full tw-capitalize tw-text-left tw-font-normal tw-py-1 tw-px-2 tw-flex tw-items-center tw-justify-between tw-bg-dark-silver">

                <span v-if="opt === 0">Studio</span>
                <span v-else>{{ opt }} Bedroom</span>

                <span class="tw-w-2 tw-h-2 tw-rounded-sm">
                <svg :class="{ 'tw-hidden': !filterStore.selectedTypes.has(opt) }" width="10" height="8"
                     viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M8.83332 1.1665L3.28282 6.71606C3.12662 6.87223 2.87336 6.87223 2.71716 6.71606L1.16666 5.1665"
                    stroke="white" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              </label>
            </div>
          </div>
        </template>
      </div>

      <div v-if="showFilter" class="tw-space-y-6">
        <div class="tw-space-y-2">
          <div class="tw-flex tw-justify-between tw-items-center tw-mb-3">
            <span class="tw-text-xs tw-text-secondary-white tw-font-semibold">
              Price ({{ filterStore.priceCurrency }})
            </span>

            <div class="tw-flex tw-items-center tw-gap-0.5">
              <input
                :value="formatNumber(priceRange[0])"
                @change="handlePriceMinChange"
                type="text"
                :style="{ width: `${Math.max(formatNumber(priceRange[0]).length * 0.515, 3)}rem` }"
                class="tw-min-w-12 tw-px-1 tw-text-sm tw-bg-white tw-bg-opacity-20 tw-tracking-tighter tw-text-white tw-rounded tw-border-none tw-outline-none tw-text-center"
              />
              <span class="tw-text-xs tw-text-secondary-white">-</span>
              <input
                :value="formatNumber(priceRange[1])"
                @change="handlePriceMaxChange"
                type="text"
                :style="{ width: `${Math.max(formatNumber(priceRange[1]).length * 0.515, 3)}rem` }"
                class="tw-min-w-12 tw-px-1 tw-text-sm tw-bg-white tw-bg-opacity-20 tw-tracking-tighter tw-text-white tw-rounded tw-border-none tw-outline-none tw-text-center"
              />
            </div>
          </div>

          <Slider :class="'tw-my-2'" v-model="priceRange" @change="(e) => filterStore.updateSelectedPriceRange(e)"
                  :min="filterStore.priceRange[0]" :max="filterStore.priceRange[1]" :tooltips="false" :lazy="false" />
        </div>

        <div class="tw-space-y-2">
          <div class="tw-flex tw-justify-between tw-items-center">
            <span class="tw-text-xs tw-text-secondary-white tw-font-semibold">
              Area range ({{ filterStore.areaUnit?.toLowerCase() }})
            </span>

            <span class="tw-text-sm tw-text-secondary-white tw-font-semibold tw-tracking-tighter">
              {{ areaRange[0] }} - {{ areaRange[1] }}
            </span>
          </div>

          <Slider :class="'tw-my-2'" v-model="areaRange" @change="(e) => filterStore.updateSelectedAreaRange(e)"
            :min="filterStore.areaRange[0]" :max="filterStore.areaRange[1]" :tooltips="false" :lazy="false" />
        </div>

        <div class="tw-space-y-2">
          <div class="tw-flex tw-justify-between tw-items-center">
            <span class="tw-text-xs tw-text-secondary-white tw-font-semibold">
              Floor range
            </span>

            <span class="tw-text-sm tw-text-secondary-white tw-font-semibold tw-tracking-tighter">
              {{ floorRange[0] }} - {{ floorRange[1] }}
            </span>
          </div>

          <Slider :class="'tw-my-2'" v-model="floorRange" @change="(e) => filterStore.updateSelectedFloorRange(e)"
            :min="filterStore.floorRange[0]" :max="filterStore.floorRange[1]" :tooltips="false" :lazy="false" />
        </div>
      </div>
    </div>

    <button v-if="showFilter" @click="toggleFilter"
            class="tw-w-full tw-mt-6 md:tw-hidden tw-text-secondary-dark tw-bg-secondary-white tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-text-center">
      Save changes
    </button>

    <button v-if="showFilter" @click="resetFilters"
      class="tw-w-full tw-mt-6 tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-text-center">
      Reset all filters
    </button>
  </div>
</template>
