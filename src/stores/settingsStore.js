import {defineStore} from 'pinia';

export const useSettingsStore = defineStore('settingsStore', {
  state: () => ({
    availableCurrencies: [],
    availableMeasurements: [],
    currency: null, // todo: hardcoded for now
    measurement: null, // todo: hardcoded for now
  }),
  actions: {
    setAvailableCurrencies(currencies) {
      this.availableCurrencies = currencies;
    },
    setAvailableMeasurements(measurements) {
      this.availableMeasurements = measurements;
    },

    setDefaults(currency, measurement) {
      this.currency = currency;
      this.measurement = measurement;
    },

    setMeasurement(measurement) {
      this.measurement = measurement;
    },
    setCurrency(currency) {
      this.currency = currency;
    }
  },
  getters: {
    getAvailableCurrencies() {
      return this.availableCurrencies;
    },
    getAvailableMeasurements() {
      return this.availableMeasurements;
    },

    getCurrency() {
      return this.currency;
    },

    getMeasurement() {
      return this.measurement;
    },
  },
});
