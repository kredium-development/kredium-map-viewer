import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useViewModeStore = defineStore('viewMode', () => {
  const viewMode = ref(localStorage.getItem('viewMode') || 'day');

  const setViewMode = (mode) => {
    viewMode.value = mode;
    localStorage.setItem('viewMode', mode);
  };

  return {
    viewMode,
    setViewMode
  };
});
