<script setup>

import { nextTick, onMounted, ref, watch } from "vue";
import { useFilterStore } from "@/stores/filterStore.js";
import BuildingService from "@/api/services/Building";
import { useRoute } from "vue-router";
import bedroomColors from "../bedroomColors";
import svgParser from "../svgParser";
import ZoomWrapperAlt from "@/components/ZoomWrapperAlt.vue";

const filterStore = useFilterStore();
const emit = defineEmits(['openUnitDrawer', 'floorChange', 'returnToBuilding']);
/**
 * Props
 *
 * units - these are the units loaded with the building. Discrepencies may occur if some sold/not visible units, which are note included in the building response, are still mapped on the floor plates.
 *         Logic may break since the code below may try to get the unit from `units` based on the `data-id` from svg. All in all, `units` may not contain ALL units in the svg.
 */
const { building, units, selectedFloor, reverseTransitionVideoSrc } = defineProps(['building', 'units', 'selectedFloor', 'reverseTransitionVideoSrc']);
const route = useRoute();
const embedUuid = route.params.embedUuid;
const buildingUuid = route.params.buildingUuid;

// ─── Floor plate detail logic ──────────────────────────────────────────────
filterStore.$subscribe(() => {
  filter();
})
const svgMapUnitIdToPath = ref({});

const currentlyHighlightedIds = ref([]);
const svgContainer = ref(null);
const floor_plates = ref([]);
const tabs = ref([]);
const frozenViewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 0);
const frozenViewportHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 0);
const floorCanvas = ref(null);
const canvasSize = ref({ width: 0, height: 0 });
const imageCache = new Map();

const getCurrentFloorPlate = () => floor_plates.value?.[activeFloorIdx.value];
const getCurrentFloorCanvas = () => floorCanvas.value?.[activeFloorIdx.value];

const getFloorImage = async (filename) => {
  if (!filename) return null;

  if (imageCache.has(filename)) {
    return imageCache.get(filename);
  }

  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = filename;
  });

  imageCache.set(filename, image);
  return image;
};

const drawCurrentFloorCanvas = async () => {
  const plate = getCurrentFloorPlate();
  const canvasEl = getCurrentFloorCanvas();
  if (!plate?.filename || !canvasEl) return;

  const image = await getFloorImage(plate.filename);
  if (!image || !canvasEl) return;

  const imageAspectRatio = image.width / image.height;
  const viewportAspectRatio = (frozenViewportWidth.value || 1) / (frozenViewportHeight.value || 1);

  let canvasWidth;
  let canvasHeight;

  if (viewportAspectRatio > imageAspectRatio) {
    canvasWidth = frozenViewportWidth.value;
    canvasHeight = canvasWidth / imageAspectRatio;
  } else {
    canvasHeight = frozenViewportHeight.value;
    canvasWidth = canvasHeight * imageAspectRatio;
  }

  canvasEl.width = canvasWidth;
  canvasEl.height = canvasHeight;

  const context = canvasEl.getContext('2d');
  if (!context) return;

  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvasWidth, canvasHeight);

  canvasSize.value = {
    width: canvasWidth,
    height: canvasHeight,
  };
};

const renderLabelsInsideSvg = () => {
  const svgContainerForCurrentFloor = svgContainer.value?.[activeFloorIdx.value];
  const svgRoot = svgContainerForCurrentFloor?.querySelector('svg');

  if (!svgContainerForCurrentFloor || !svgRoot) return;

  const existingLayer = svgRoot.querySelector('#unit-label-layer');
  if (existingLayer) {
    existingLayer.remove();
  }

  const labelLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  labelLayer.setAttribute('id', 'unit-label-layer');
  labelLayer.setAttribute('pointer-events', 'none');

  Object.keys(svgMapUnitIdToPath.value).forEach((id) => {
    const path = svgMapUnitIdToPath.value[id];
    const unit = units[id];
    if (!path || !unit) return;

    const bbox = path.getBBox();
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;

    const labelWidth = 92;
    const labelHeight = 20;
    const typeLabelHeight = 18;
    const gap = 4;

    const titleFo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    titleFo.setAttribute('x', `${centerX - labelWidth / 2}`);
    titleFo.setAttribute('y', `${centerY - labelHeight - 8}`);
    titleFo.setAttribute('width', `${labelWidth}`);
    titleFo.setAttribute('height', `${labelHeight}`);
    titleFo.setAttribute('pointer-events', 'all');

    const titleDiv = document.createElement('div');
    titleDiv.style.display = 'flex';
    titleDiv.style.alignItems = 'center';
    titleDiv.style.justifyContent = 'center';
    titleDiv.style.width = '100%';
    titleDiv.style.height = '100%';
    titleDiv.style.background = 'rgba(35, 35, 35, 0.48)';
    titleDiv.style.borderRadius = '9999px';
    titleDiv.style.color = '#fff';
    titleDiv.style.fontSize = '12px';
    titleDiv.style.fontWeight = '600';
    titleDiv.style.lineHeight = '16px';
    titleDiv.style.whiteSpace = 'nowrap';
    titleDiv.style.overflow = 'hidden';
    titleDiv.style.textOverflow = 'ellipsis';
    titleDiv.style.cursor = 'pointer';
    titleDiv.textContent = unit?.name ?? '';
    titleDiv.onclick = () => emitOpenUnitDrawer(unit);
    titleFo.appendChild(titleDiv);
    labelLayer.appendChild(titleFo);

    if (unit?.layout_code) {
      const typeFo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
      typeFo.setAttribute('x', `${centerX - labelWidth / 2}`);
      typeFo.setAttribute('y', `${centerY + gap}`);
      typeFo.setAttribute('width', `${labelWidth}`);
      typeFo.setAttribute('height', `${typeLabelHeight}`);
      typeFo.setAttribute('pointer-events', 'all');

      const typeDiv = document.createElement('div');
      typeDiv.style.display = 'flex';
      typeDiv.style.alignItems = 'center';
      typeDiv.style.justifyContent = 'center';
      typeDiv.style.width = '100%';
      typeDiv.style.height = '100%';
      typeDiv.style.background = 'rgba(35, 35, 35, 0.48)';
      typeDiv.style.borderRadius = '9999px';
      typeDiv.style.color = '#fff';
      typeDiv.style.fontSize = '11px';
      typeDiv.style.fontWeight = '600';
      typeDiv.style.lineHeight = '16px';
      typeDiv.style.whiteSpace = 'nowrap';
      typeDiv.style.overflow = 'hidden';
      typeDiv.style.textOverflow = 'ellipsis';
      typeDiv.style.cursor = 'pointer';
      typeDiv.textContent = unit.layout_code;
      typeDiv.onclick = () => emitOpenUnitDrawer(unit);
      typeFo.appendChild(typeDiv);
      labelLayer.appendChild(typeFo);
    }
  });

  svgRoot.appendChild(labelLayer);
};

/**
 * activeFloorIdx is the index of the active floor in the floor_plates (not in tabs!).
 */
const activeFloorIdx = ref(0);

const generateTabs = () => {
  /**
   * Floor plates are returned from api sorted by floor ascending.
   *
   * On the UI below, we want to show them by floor descending.
   *
   * Tabs are generated by reversing the floors from the api.
   */
  tabs.value = floor_plates.value.map(f => f.floor).reverse();
};

const setActiveFloorIdx = (tabIdx) => {
  if(tabIdx < 0 || tabIdx >= floor_plates.value.length) return;

  activeFloorIdx.value = tabIdx;
  emit('floorChange', Number.parseInt(floor_plates.value[tabIdx]?.floor, 10));
  loadNewSvgContent();
};

const filter = async () => {
  const filters = filterStore.getFilters;
  (new BuildingService).filter(embedUuid, buildingUuid, filters)
    .then((res) => {
      highlightPathsByIds(res.data);
    });
}

const loadNewSvgContent = async () => {
  // wait for dom to load svg
  await nextTick(async () => {
    await drawCurrentFloorCanvas();

    // parse svg
    parseSvg();

    // filter();
    highlightPathsByIds(Object.keys(units))
  });
}

const emitOpenUnitDrawer = (unit) => {
  emit('openUnitDrawer', unit);
}

const handlePathClick = (event) => {
  emitOpenUnitDrawer(units[event.target.getAttribute('data-id')]);
};

const handlePathMouseOver = (event) => {
  const id = event.target.getAttribute('data-id');
  svgMapUnitIdToPath.value[id].style.fill = `${bedroomColors[units[id].number_of_bedrooms]}A3`;
}

const handlePathMouseLeave = (event) => {
  const id = event.target.getAttribute('data-id');
  svgMapUnitIdToPath.value[id].style.fill = `${bedroomColors[units[id].number_of_bedrooms]}7A`;
}


const parseSvg = () => {
  const svgContainerForCurrentFloor = svgContainer.value?.[activeFloorIdx.value];
  if (svgContainerForCurrentFloor) {
    svgMapUnitIdToPath.value = svgParser(svgContainerForCurrentFloor);

    const svgEl = svgContainerForCurrentFloor.querySelector('svg');
    if (svgEl) {
      svgEl.setAttribute('preserveAspectRatio', 'none');
      svgEl.style.overflow = 'visible';
    }

    nextTick().then(() => {
      renderLabelsInsideSvg();
    })
  }
};

const highlightPathsByIds = (idList) => {
  // Reset all <path> to have no style
  currentlyHighlightedIds.value.forEach(k => {
    if (svgMapUnitIdToPath.value[k]) {
      svgMapUnitIdToPath.value[k].classList.add('tw-fill-transparent');
      svgMapUnitIdToPath.value[k].classList.remove('tw-stroke-white', 'tw-cursor-pointer');
      svgMapUnitIdToPath.value[k].style.fill = '';
      svgMapUnitIdToPath.value[k].removeEventListener('mouseenter', handlePathMouseOver);
      svgMapUnitIdToPath.value[k].removeEventListener('mouseleave', handlePathMouseLeave);
      svgMapUnitIdToPath.value[k].removeEventListener('click', handlePathClick);
    }
  });

  currentlyHighlightedIds.value = idList;

  // Highlight all passed in ids
  idList.forEach(highlightPathById);
}

const highlightPathById = (id) => {
  if (svgMapUnitIdToPath.value[id]) {
    svgMapUnitIdToPath.value[id].classList.add('tw-stroke-black', 'tw-cursor-pointer');
    if (units[id]) {
      svgMapUnitIdToPath.value[id].style.fill = `${bedroomColors[units[id].number_of_bedrooms]}7A`;
      svgMapUnitIdToPath.value[id].addEventListener('mouseenter', handlePathMouseOver);
      svgMapUnitIdToPath.value[id].addEventListener('mouseleave', handlePathMouseLeave);
      svgMapUnitIdToPath.value[id].addEventListener('click', handlePathClick)
    }
  }
}

onMounted(() => {
  floor_plates.value = building.floor_plates;

  generateTabs();

  // If a specific floor was selected, navigate there
  if (selectedFloor !== undefined && selectedFloor !== null) {
    const idx = floor_plates.value.findIndex(fp => fp.floor === selectedFloor);
    if (idx !== -1) {
      setActiveFloorIdx(idx);
    } else {
      setActiveFloorIdx(floor_plates.value.length - 1);
    }
  } else {
    setActiveFloorIdx(floor_plates.value.length - 1);
  }
})

watch(
  () => selectedFloor,
  (newFloor) => {
    if (newFloor === undefined || newFloor === null) return;
    const idx = floor_plates.value.findIndex((fp) => Number.parseInt(fp.floor, 10) === Number.parseInt(newFloor, 10));
    if (idx !== -1 && idx !== activeFloorIdx.value) {
      setActiveFloorIdx(idx);
    }
  }
);
</script>

<template>
  <div
    class="tw-fixed tw-inset-0 tw-z-0 tw-flex tw-h-full tw-overflow-hidden tw-items-center tw-gap-3 tw-w-full"
  >

    <div class="tw-overflow-x-auto tw-relative tw-h-full tw-w-full">
      <!--
      Here we are rendering the floor_plates array in normal order, using activeFloorIdx which is and idx for this array (and not tabs!)
       -->
      <div v-for="(item, i) in floor_plates" :key="i" v-show="i === activeFloorIdx" class="tw-relative tw-h-full tw-w-full">
        <zoom-wrapper-alt :width="canvasSize.width || frozenViewportWidth">
          <div
            class="tw-relative"
            :style="{
              width: `${canvasSize.width || frozenViewportWidth}px`,
              height: `${canvasSize.height || frozenViewportHeight}px`,
            }"
          >
            <canvas ref="floorCanvas" class="tw-block tw-w-full tw-h-full" />

            <div
              v-if="item.views"
              class="tw-absolute tw-top-0 tw-left-0 tw-w-full tw-h-full [&>svg]:tw-w-full [&>svg]:tw-h-full"
              ref="svgContainer"
              v-html="item.views[0]?.svg_overlay"
            ></div>
          </div>
        </zoom-wrapper-alt>
      </div>
    </div>

    <!-- Return to Building button -->
    <button
      @click="emit('returnToBuilding', reverseTransitionVideoSrc)"
      class="tw-fixed tw-bottom-2 tw-left-1/2 -tw-translate-x-1/2 tw-z-10 tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-cursor-pointer"
      style="background: rgba(35, 35, 35, 0.84); padding: 12px 24px 12px 24px; color: #fff; font-size: 14px; font-weight: 500; border: none;"
    >
      <span>Return to Building</span>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.7331 8.22034C14.8737 5.45532 12.146 3.56838 8.87657 3.51233V0.280239C8.87657 0.130778 8.74579 0 8.59633 0C8.54028 0 8.48423 0.0186826 8.42818 0.0560478L0.114431 6.07184C-0.0163473 6.16526 -0.0350299 6.3334 0.0583831 6.46418L0.114431 6.52023L8.42818 12.4987C8.55896 12.5921 8.72711 12.5547 8.82052 12.4426C8.85788 12.3866 8.87657 12.3305 8.87657 12.2745V9.06106C10.8943 9.06106 12.5944 10.0139 13.1922 11.4524C13.6967 12.6855 13.2857 14.0119 12.09 15.1142C11.9779 15.2263 11.9592 15.3945 12.0713 15.5066C12.1273 15.5626 12.2021 15.6 12.2768 15.6H12.501C12.557 15.6 12.6131 15.5813 12.6504 15.5439C15.3968 13.7317 16.5738 10.9106 15.7331 8.22034Z" fill="rgba(248, 248, 248, 0.32)"/>
      </svg>
    </button>
  </div>
</template>

<style scoped lang="sass">

</style>
