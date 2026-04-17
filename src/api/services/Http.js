import {useSettingsStore} from '@/stores/settingsStore';
import axios from 'axios';

const settingsStore = useSettingsStore();

const HttpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Replace with your API base URL
  timeout: 10000, // Request timeout in milliseconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
HttpClient.interceptors.request.use(function (config) {
  if (settingsStore.getMeasurement !== null) {
    config.headers['X-Area-Unit'] = settingsStore.getMeasurement;
  }
  if (settingsStore.getCurrency !== null) {
    config.headers['X-Currency'] = settingsStore.getCurrency;
  }
  return config;
});

HttpClient.interceptors.response.use(
  response => response.data,
  error => Promise.reject(error)
);

export default HttpClient;
