import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useFloorSelectionStore = defineStore('floorSelection', () => {
  const currentFloor = ref(null);
  const showOnlyAvailable = ref(false);
  const floorPlates = ref([]);

  const setCurrentFloor = (floor) => {
    currentFloor.value = floor;
  };

  const setShowOnlyAvailable = (show) => {
    showOnlyAvailable.value = show;
  };

  const setFloorPlates = (plates) => {
    floorPlates.value = plates;
  };

  const groupedFloors = () => {
    if (floorPlates.value.length === 0) {
      return [];
    }

    const allFloors = floorPlates.value.map(fp => fp.floor).sort((a, b) => a - b);
    const grouped = [];

    for (let i = 0; i < allFloors.length; i += 10) {
      grouped.push({
        label: `${allFloors[i]}-${allFloors[Math.min(i + 9, allFloors.length - 1)]}`,
        floors: allFloors.slice(i, i + 10)
      });
    }

    return grouped;
  };

  return {
    currentFloor,
    showOnlyAvailable,
    floorPlates,
    setCurrentFloor,
    setShowOnlyAvailable,
    setFloorPlates,
    groupedFloors
  };
});
