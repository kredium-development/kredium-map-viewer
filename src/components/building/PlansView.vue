<script setup>
import UnitsPagination from "@/components/building/UnitsPagination.vue";
import UnitSceletonCard from "@/components/sceletons/UnitCard.vue";

const { building } = defineProps(['building']);
const emit = defineEmits(['openUnitDrawer']);
</script>

<template>
  <div class="tw-overflow-x-auto tw-grow" @click.self="toggleDropdown">
    <Suspense>
      <UnitsPagination :building="building" @open-unit-drawer="u => emit('openUnitDrawer', u)" />

      <template #fallback>
        <!-- Sceleton -->
        <div class="tw-flex tw-flex-wrap tw-items-start tw-gap-7">
          <UnitSceletonCard v-for="(i) in 4" :key="i" />
        </div>
      </template>
    </Suspense>
  </div>

</template>

<style scoped lang="sass">

</style>
