import {defineStore} from 'pinia';

export const useMapAnimationStore = defineStore('mapAnimationStore', {
  state: () => ({
    projectStates: new Map(),
    canvasState: new Map(),
  }),
  actions: {
    addProjectState(key, state) {
      this.projectStates.set(key, state);
    },

    addCanvasState(key, state) {
      this.canvasState.set(key, state);
    },
  },
  getters: {
    getProjectState() {
      return (key) => this.projectStates.get(key);
    },

    getCanvasState() {
      return (key) => this.canvasState.get(key);
    },
  },
});
