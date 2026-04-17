import {defineStore} from 'pinia';
import {useSettingsStore} from "@/stores/settingsStore.js";

const settingsStore = useSettingsStore();
export const useFilterStore = defineStore('filterStore', {
  state: () => ({
    areaUnit: '',
    priceCurrency: '',

    roomTypes: new Set(),
    priceRange: [0, 0],
    areaRange: [0, 0],
    floorRange: [0, 0],

    selectedTypes: new Set(),
    selectedPriceRange: [null, null],
    selectedAreaRange: [null, null],
    selectedFloorRange: [null, null],
  }),
  actions: {
    /**
     * Adapt the filter values to the complex
     */
    adaptToComplex(complex) {
      let minArea = 0, maxArea = 0, minFloor = 0, maxFloor = 0, minPrice = 0, maxPrice = 0;
      let uniqueBedrooms = new Set();

      if (complex.buildings && complex.buildings.length > 0) {
        complex.buildings.forEach(building => {
          building.units?.forEach(unit => {
            this.areaUnit = settingsStore.measurement;
            this.priceCurrency = settingsStore.currency;

            if ((unit.price && unit.price < minPrice) || minPrice === 0) minPrice = unit.price
            if ((unit.price && unit.price > maxPrice)) maxPrice = unit.price


            if ((unit.unit_area_real && unit.unit_area_real < minArea) || minArea === 0) minArea = unit.unit_area_real;
            if (unit.unit_area_real && unit.unit_area_real > maxArea) maxArea = unit.unit_area_real;

            if (unit.floor < minFloor) minFloor = unit.floor;
            if (unit.floor > maxFloor) maxFloor = unit.floor;

            if (unit.number_of_bedrooms !== null) uniqueBedrooms.add(unit.number_of_bedrooms);
          });
        });
      }

      this.selectedAreaRange = this.areaRange = [Math.floor(minArea), Math.ceil(maxArea)];
      this.selectedFloorRange = this.floorRange = [minFloor, maxFloor];
      this.selectedPriceRange = this.priceRange = [Math.floor(minPrice), Math.ceil(maxPrice)];

      const sortedBedrooms = [...uniqueBedrooms].sort();
      this.selectedTypes = new Set(sortedBedrooms);
      this.roomTypes = new Set(sortedBedrooms);
    },

    /**
     * Adapt the filter values to the building
     */
    adaptToBuilding(building) {
      this.selectedAreaRange = [null, null];
      this.selectedFloorRange = [null, null];
      this.selectedPriceRange = [null, null];

      let minArea = 0, maxArea = 0, minFloor = 0, maxFloor = 0, minPrice = 0, maxPrice = 0;
      let uniqueBedrooms = new Set();
      if (building.units && building.units.length > 0) {
        minArea = maxArea = building.units[0].unit_area_real;
        minFloor = maxFloor = building.units[0].floor;

        building.units.forEach(unit => {
          this.areaUnit = settingsStore.measurement;
          this.priceCurrency = settingsStore.currency;

          if ((unit.price && unit.price < minPrice) || minPrice === 0) minPrice = unit.price
          if ((unit.price && unit.price > maxPrice)) maxPrice = unit.price

          if ((unit.living_area_converted && unit.living_area_converted < minArea) || minArea === 0) minArea = unit.living_area_converted;
          if (unit.living_area_converted && unit.living_area_converted > maxArea) maxArea = unit.living_area_converted;

          if (unit.floor < minFloor) minFloor = unit.floor;
          if (unit.floor > maxFloor) maxFloor = unit.floor;

          if (unit.number_of_bedrooms !== null) uniqueBedrooms.add(unit.number_of_bedrooms);
        });
      }

      this.areaRange = [Math.floor(minArea), Math.ceil(maxArea)];
      if (this.selectedAreaRange[0] === null || this.selectedAreaRange[0] < this.areaRange[0]) {
        this.selectedAreaRange[0] = this.areaRange[0];
      }
      if (this.selectedAreaRange[1] === null || this.selectedAreaRange[1] > this.areaRange[1]) {
        this.selectedAreaRange[1] = this.areaRange[1];
      }

      this.floorRange = [minFloor, maxFloor];
      if (this.selectedFloorRange[0] === null || this.selectedFloorRange[0] < this.floorRange[0]) {
        this.selectedFloorRange[0] = this.floorRange[0];
      }
      if (this.selectedFloorRange[1] === null || this.selectedFloorRange[1] > this.floorRange[1]) {
        this.selectedFloorRange[1] = this.floorRange[1];
      }

      this.priceRange = [Math.floor(minPrice), Math.ceil(maxPrice)];
      if (this.selectedPriceRange[0] === null || this.selectedPriceRange[0] < this.priceRange[0]) {
        this.selectedPriceRange[0] = this.priceRange[0];
      }
      if (this.selectedPriceRange[1] === null || this.selectedPriceRange[1] > this.priceRange[1]) {
        this.selectedPriceRange[1] = this.priceRange[1];
      }

      const sortedBedrooms = [...uniqueBedrooms].sort();
      if (this.selectedTypes.size === 0) {
        this.selectedTypes = new Set(sortedBedrooms);
      }
      this.roomTypes = new Set(sortedBedrooms);
    },

    updateSelectedAreaRange(range) {
      this.selectedAreaRange = range;
    },

    updateSelectedPriceRange(range) {
      if(range[0] < this.priceRange[0]) {
        range[0] = this.priceRange[0];
      }

      if(range[1] > this.priceRange[1]) {
        range[1] = this.priceRange[1];
      }

      this.selectedPriceRange = range;
    },

    updateSelectedFloorRange(range) {
      this.selectedFloorRange = range;
    },

    updateSelectedTypes(type) {
      if (!this.selectedTypes.has(type)) {
        this.selectedTypes.add(type)
      } else {
        this.selectedTypes.delete(type)
      }
    },

    resetFilters() {
      this.selectedTypes = new Set(this.roomTypes);
      this.selectedAreaRange = this.areaRange;
      this.selectedFloorRange = this.floorRange;
    },
    filterBuildingUnitsByPriceRange(building) {
      let units = [];
      units = building.units.filter(unit =>
              unit.price === null || (
                unit.price >= this.selectedPriceRange[0] &&
                unit.price <= this.selectedPriceRange[1]
              )
          )
              .map(unit => unit.uuid);

      return units
    },
    filterComplexBuildingsByPriceRange(complex) {
      let ids = [];
      ids = complex.buildings.filter(building =>
          (building.units || []).some(unit =>
              unit.price === null || (
                unit.price >= this.selectedPriceRange[0] &&
                unit.price <= this.selectedPriceRange[1]
              )
          )
      )
          .map(building => building.uuid);

      return ids;
    }
  },
  getters: {
    getFilters() {
      let params = new URLSearchParams();

      this.selectedTypes.forEach(item => {
        params.append('nbd[]', item);
      })

      params.append('uamin', this.selectedAreaRange[0])
      params.append('uamax', this.selectedAreaRange[1])
      params.append('fmin', this.selectedFloorRange[0])
      params.append('fmax', this.selectedFloorRange[1])

      return params
    },
  },
});
