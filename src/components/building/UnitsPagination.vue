<script setup>
import { formatNumber } from "@/mixins/formatNumber.js";
import { ref } from "vue";
import UnitGridCard from "@/components/building/UnitGridCard.vue";
import { useFilterStore } from "@/stores/filterStore.js";
import AngleLeft from "@/components/icons/AngleLeft.vue";
import AngleRight from "@/components/icons/AngleRight.vue";
import BuildingService from "@/api/services/Building";
import { useRoute } from "vue-router";
import InlineSvg from "../InlineSvg.vue";

const route = useRoute();
const emit = defineEmits(['openUnitDrawer']);
const embedUuid = route.params.embedUuid;
const { building } = defineProps(['building']);
const buildingUuid = route.params.buildingUuid;
const listView = ref('grid')
const showSort = ref(false)
const units = ref([]);
const pagination = ref({ page: 1, perPage: 21 });
const paginationMeta = ref({
  last_page: 0,
  total: 0,
});
const selectedSortOption = ref(null);

const sortOptions = {
  'Price Up': 'price_up',
  'Price Down': 'price_down',
  'Square Up': 'area_up',
  'Square Down': 'area_down',
  'Bedrooms Up': 'bedrooms_up',
  'Bedrooms Down': 'bedrooms_down',
  'Floor Up': 'floor_up',
  'Floor Down': 'floor_down',
  'Layout Code Up': 'layout_code_up',
  'Layout Code Down': 'layout_code_down',
  'Name Up': 'name_up',
  'Name Down': 'name_down',
  'Study Up': 'study_up',
  'Study Down': 'study_down',
  'Maid Up': 'maid_up',
  'Maid Down': 'maid_down',
}

const setSort = (sortOpt) => {
  selectedSortOption.value = sortOpt;
  showSortDropdown();
  pagination.value.page = 1;
  filter();
}

const toggleSort = (type) => {
  const upOption = sortOptions[`${type} Up`];
  const downOption = sortOptions[`${type} Down`];

  if(selectedSortOption.value === downOption) {
    selectedSortOption.value = null;
  } else {
    selectedSortOption.value = selectedSortOption.value === upOption ? downOption : upOption;
  }

  pagination.value.page = 1;
  filter();
};

const filterStore = useFilterStore();
filterStore.$subscribe(() => {
  pagination.value.page = 1;
  filter();
})

const filter = async () => {
  const filters = filterStore.getFilters;
  filters.set('page', pagination.value.page);
  filters.set('per_page', pagination.value.perPage);
  if (selectedSortOption.value) filters.set('s', selectedSortOption.value);
  else filters.delete('s');

  (new BuildingService).units(embedUuid, buildingUuid, filters)
    .then((res) => {
      units.value = res.data;
      paginationMeta.value = res.meta;
    });
}

await filter();

const paginate = (direction) => {
  if (direction === -1 && pagination.value.page > 1) {
    pagination.value.page -= 1;
  } else if (direction === 1 && pagination.value.page < paginationMeta.value.last_page) {
    pagination.value.page += 1;
  }
  filter();
}

const goToPage = (newPage) => {
  if (newPage !== pagination.value.page) {
    pagination.value.page = newPage;
    filter();
  }
}

const setListView = (view) => {
  listView.value = view;
}

const showSortDropdown = () => {
  showSort.value = !showSort.value;
};
</script>

<template>
  <div>
    <div class="tw-flex tw-justify-between tw-items-center tw-mb-3">
      <!-- Sort dropdown when in grid mode -->
      <div class="tw-relative" v-if="listView === 'grid'">
        <button @click.prevent="showSortDropdown"
          class="tw-flex tw-items-center tw-bg-white tw-border tw-border-stroke tw-py-2 tw-px-3 tw-text-sm tw-rounded-lg hover:tw-bg-oil"
          :class="{ 'tw-bg-oil': showSort }">
          Sort by property

          <span class="tw-ml-2">
            <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 2L6 6L10 2" stroke="#241C15" stroke-width="1.5" stroke-linecap="square" />
            </svg>
          </span>

        </button>

        <div
          :class="[showSort ? 'tw-absolute tw-z-50 tw-top-11 tw-w-full tw-left-0 tw-bg-white tw-border tw-border-stroke tw-py-2 tw-px-3 tw-space-y-1 tw-text-sm tw-rounded-lg' : 'tw-hidden']">
          <button v-for="optK in Object.keys(sortOptions)" :key="optK"
            @click="setSort(sortOptions[optK])"
            class="tw-flex tw-items-center tw-w-full tw-text-left hover:tw-text-primary"
            :class="{ 'tw-text-primary tw-font-medium': selectedSortOption === sortOptions[optK] }">
            {{ optK }}
          </button>
        </div>
      </div>

      <!-- List / grid switcher -->
      <div
        class="tw-bg-white tw-flex tw-justify-start tw-items-center tw-gap-1 tw-my-[1px] tw-p-0.5 tw-bg-opacity-50 tw-ml-auto tw-rounded-md">
        <button class="tw-px-3 tw-py-1 tw-rounded tw-flex tw-gap-1 tw-items-center tw-justify-center"
          :class="{ 'tw-bg-light-green tw-text-primary': listView === 'grid' }" @click.prevent="setListView('grid')">
          <span>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.2002 1.3999V16.5999" :stroke="[listView === 'grid' ? '#339671' : '#241C15']"
                stroke-linejoin="round" />
              <path d="M11.7998 1.3999V16.5999" :stroke="[listView === 'grid' ? '#339671' : '#241C15']"
                stroke-linejoin="round" />
              <path d="M1.3999 11.8H16.5999" :stroke="[listView === 'grid' ? '#339671' : '#241C15']"
                stroke-linejoin="round" />
              <path d="M1.3999 6.19995H16.5999" :stroke="[listView === 'grid' ? '#339671' : '#241C15']"
                stroke-linejoin="round" />
              <path
                d="M15.6399 1.3999H2.35991C1.82972 1.3999 1.3999 1.82987 1.3999 2.36006V15.6397C1.3999 16.1699 1.82972 16.5999 2.35991 16.5999H15.6399C16.1701 16.5999 16.5999 16.1699 16.5999 15.6397V2.36006C16.5999 1.82987 16.1701 1.3999 15.6399 1.3999Z"
                :stroke="[listView === 'grid' ? '#339671' : '#241C15']" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </span>
          Grid
        </button>

        <button class="tw-px-3 tw-py-1 tw-rounded tw-flex tw-gap-1 tw-items-center tw-justify-center"
          :class="{ 'tw-bg-light-green tw-text-primary': listView === 'list' }" @click.prevent="setListView('list')">
          <span>
            <svg width="18" height="16" viewBox="0 0 18 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.3335 10.3333H16.6668" :stroke="[listView === 'list' ? '#339671' : '#241C15']"
                stroke-linejoin="round" />
              <path d="M1.3335 5.66675H16.6668" :stroke="[listView === 'list' ? '#339671' : '#241C15']"
                stroke-linejoin="round" />
              <path
                d="M1.3335 1.66667L1.3335 14.3333C1.3335 14.7015 1.63197 15 2.00016 15L16.0002 15C16.3684 15 16.6668 14.7015 16.6668 14.3333V1.66667C16.6668 1.29848 16.3684 1 16.0002 1L2.00016 1C1.63197 1 1.3335 1.29848 1.3335 1.66667Z"
                :stroke="[listView === 'list' ? '#339671' : '#241C15']" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </span>
          List
        </button>
      </div>
    </div>

    <!-- Actual Grid -->
    <template v-if="listView === 'grid'">
      <div class="tw-flex tw-flex-wrap tw-gap-7 tw-mb-3">
        <UnitGridCard v-for="(unit) in units" @click.prevent="emit('openUnitDrawer', unit)" :key="unit.id"
          :unit="unit" />
      </div>
    </template>

    <!-- Actual List -->
    <template v-if="listView === 'list'">
      <div class="tw-rounded-xl tw-max-w-full tw-mb-3 tw-border tw-relative tw-overflow-x-auto">
        <table class="tw-table-auto tw-overflow-hidden tw-rounded-xl tw-bg-white tw-w-full">
          <thead>
            <tr class="tw-bg-mercury tw-text-left">
              <th class="tw-px-4 tw-py-3 tw-whitespace-nowrap tw-font-semibold" v-if="units[0] && units[0].unit_plans !== undefined">Apartment plan</th>
              <th class="tw-px-4 tw-py-3 tw-whitespace-nowrap">
                <div class="tw-flex tw-justify-between tw-items-center tw-font-semibold">
                  Unit name
                  <button @click="toggleSort('Name')">
                    <InlineSvg icon="sort" />
                  </button>
                </div>
              </th>
              <th v-if="building.units.some(u => u.layout_code)" class="tw-px-4 tw-py-3 tw-whitespace-nowrap">
                <div class="tw-flex tw-justify-between tw-items-center tw-font-semibold">
                  Layout code
                  <button @click="toggleSort('Layout Code')">
                    <InlineSvg icon="sort" />
                  </button>
                </div>
              </th>
              <th class="tw-px-4 tw-py-3">
                <div class="tw-flex tw-justify-between tw-items-center tw-font-semibold">

                Bedrooms
                <button @click="toggleSort('Bedrooms')">
                  <InlineSvg icon="sort" />
                </button>
                </div>
              </th>
              <th v-if="building.units.some(u => u.study)" class="tw-px-4 tw-py-3 tw-whitespace-nowrap">
                  <div class="tw-flex tw-justify-between tw-items-center tw-font-semibold">
                      Study
                      <button @click="toggleSort('Study')">
                          <InlineSvg icon="sort" />
                      </button>
                  </div>
              </th>
              <th v-if="building.units.some(u => u.maid)" class="tw-px-4 tw-py-3 tw-whitespace-nowrap">
                  <div class="tw-flex tw-justify-between tw-items-center tw-font-semibold">
                      Maid
                      <button @click="toggleSort('Maid')">
                          <InlineSvg icon="sort" />
                      </button>
                  </div>
              </th>
              <th class="tw-px-4 tw-py-3">
                <div class="tw-flex tw-justify-between tw-items-center tw-font-semibold">
                  Floor
                  <button @click="toggleSort('Floor')">
                    <InlineSvg icon="sort" />
                  </button>
                </div>
              </th>
              <th class="tw-px-4 tw-py-3">
                <div class="tw-flex tw-justify-between tw-items-center tw-font-semibold">
                  Area
                  <button @click="toggleSort('Square')" class="tw-align-middle tw-flex-inline tw-items-center">
                    <InlineSvg icon="sort" />
                  </button>
                </div>
              </th>
              <th class="tw-px-4 tw-py-3">
                <div class="tw-flex tw-justify-between tw-items-center tw-font-semibold">
                  Price
                  <button v-if="units.some(u => u.price !== null)" @click="toggleSort('Price')" class="tw-align-middle tw-flex-inline tw-items-center">
                    <InlineSvg icon="sort" />
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="tw-divide-y">
            <tr v-for="unit in units" :key="unit.id" @click.prevent="emit('openUnitDrawer', unit)"
              class="tw-cursor-pointer hover:tw-bg-silver">
              <td v-if="unit.unit_plans" class="tw-px-4 tw-py-3">
                <div class="tw-flex tw-items-center">
                  <img :src="unit.unit_plans[0]?.filename" class="tw-w-14 tw-h-12 tw-object-contain" alt="Flat plan">
                </div>
              </td>
              <td class="tw-px-4 tw-py-3 tw-whitespace-nowrap">{{ unit.name }}</td>
              <td v-if="building.units.some(u => u.layout_code)" class="tw-px-4 tw-py-3 tw-whitespace-nowrap">{{ unit.layout_code }}</td>
              <td class="tw-px-4 tw-py-3 tw-align-middle">
                <span>{{ unit.number_of_bedrooms === 0 ? 'Studio' : unit.number_of_bedrooms }}</span>
              </td>
              <td v-if="building.units.some(u => u.study)" class="tw-px-4 tw-py-3 tw-whitespace-nowrap">
                <span v-if="unit.study">
                    <svg width="20" height="16"
                         viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                          d="M8.83332 1.1665L3.28282 6.71606C3.12662 6.87223 2.87336 6.87223 2.71716 6.71606L1.16666 5.1665"
                          stroke="#1C604A" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </span>
              </td>
              <td v-if="building.units.some(u => u.maid)" class="tw-px-4 tw-py-3 tw-whitespace-nowrap">
                <span v-if="unit.maid">
                    <svg width="20" height="16"
                         viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                          d="M8.83332 1.1665L3.28282 6.71606C3.12662 6.87223 2.87336 6.87223 2.71716 6.71606L1.16666 5.1665"
                          stroke="#1C604A" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </span>
              </td>
              <td class="tw-px-4 tw-py-3 tw-whitespace-nowrap">{{ unit.floor }}</td>
              <td class="tw-px-4 tw-py-3 tw-whitespace-nowrap">{{ unit.unit_area }} {{ unit.area_unit?.toLowerCase() }}</td>

              <template v-if="unit.price">
                <td class="tw-px-4 tw-py-3 tw-whitespace-nowrap">{{ unit.price_currency }} {{ formatNumber(unit.price) }}</td>
              </template>

              <template v-else>
                <td class="tw-px-4 tw-py-3">
                  <div
                    class="tw-bg-secondary-primary tw-w-max tw-flex tw-items-center tw-p-2 tw-text-white tw-rounded-lg">
                    Ask for price

                    <span class="tw-ml-2">
                      <svg width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1.3999 9L14.3999 9" stroke="white" stroke-width="1.5" stroke-linecap="square" />
                        <path d="M8.3999 2L15.3999 9L8.3999 16" stroke="white" stroke-width="1.5"
                          stroke-linecap="square" />
                      </svg>
                    </span>
                  </div>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </template>


    <div v-show="paginationMeta.last_page > 1">
      <div class="tw-flex tw-space-x-2 tw-mb-3">
        <button class="tw-w-10 tw-h-10 tw-rounded tw-border tw-flex tw-items-center tw-justify-center tw-bg-white"
          @click="paginate(-1)" v-show="pagination.page > 1">
          <AngleLeft />
        </button>

        <button v-for="p in paginationMeta.last_page" :class="{
          'tw-bg-[#F0F9F5] tw-text-secondary-primary tw-border-[#8DB0A4]': pagination.page === p,
        }" class="tw-w-10 tw-h-10 tw-rounded tw-border tw-flex tw-items-center tw-justify-center tw-bg-white"
          @click="goToPage(p)" v-bind:key="p">
          {{ p }}
        </button>

        <button class="tw-w-10 tw-h-10 tw-rounded tw-border tw-flex tw-items-center tw-justify-center tw-bg-white"
          @click="paginate(1)" v-show="pagination.page < paginationMeta.last_page">
          <AngleRight />
        </button>
      </div>

      <span class="tw-text-[#64626A]">{{
        pagination.perPage * (pagination.page - 1) + units.length
      }} from {{ paginationMeta.total }}</span>
    </div>
  </div>
</template>
