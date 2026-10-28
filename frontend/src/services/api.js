import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform, NativeModules } from 'react-native';

const BACKEND_PORT = 5001; // Current active server port

export const getAutoDetectedApiUrl = () => {
  if (Platform.OS === 'web') {
    return `http://localhost:${BACKEND_PORT}/api`;
  }

  try {
    // 1. Try scriptURL from NativeModules.SourceCode (packager bundle host)
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        return `http://${match[1]}:${BACKEND_PORT}/api`;
      }
    }

    // 2. Try Constants.expoConfig?.hostUri or debuggerHost
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:${BACKEND_PORT}/api`;
      }
    }

    // 3. Try Constants.linkingUri
    if (Constants.linkingUri) {
      const match = Constants.linkingUri.match(/:\/\/([^:/]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        return `http://${match[1]}:${BACKEND_PORT}/api`;
      }
    }
  } catch (e) {
    // ignore
  }

  return `http://192.168.1.7:${BACKEND_PORT}/api`;
};

const api = axios.create({
  baseURL: getAutoDetectedApiUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach JWT token and apply custom URL if set
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const customUrl = await AsyncStorage.getItem('@custom_api_url');
      if (customUrl && customUrl.trim()) {
        const trimmed = customUrl.trim().replace(/\\/g, '/');
        // Clear invalid localhost config on native devices so it doesn't break mobile networking
        if (Platform.OS !== 'web' && (trimmed.includes('localhost') || trimmed.includes('127.0.0.1'))) {
          await AsyncStorage.removeItem('@custom_api_url');
          config.baseURL = getAutoDetectedApiUrl();
        } else {
          const cleaned = trimmed.replace(/\/health$/, '').replace(/\/$/, '');
          config.baseURL = cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
        }
      } else {
        config.baseURL = getAutoDetectedApiUrl();
      }
    } catch (e) {
      console.warn('Error configuring API request:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

export const medicationApi = {
  getMedications: (patientId) => api.get('/medications', { params: { patientId } }),
  getMedicationById: (id) => api.get(`/medications/${id}`),
  createMedication: (data) => api.post('/medications', data),
  updateMedication: (id, data) => api.put(`/medications/${id}`, data),
  deleteMedication: (id) => api.delete(`/medications/${id}`),
  addRefill: (id, data) => api.post(`/medications/${id}/refill`, data),
  scanMedicationImage: (imageBase64) => api.post('/medications/scan-image', { imageBase64 }, { timeout: 45000 })
};

export const scheduleApi = {
  getTodayDoses: (dateStr, patientId) => api.get('/schedules/today', { params: { date: dateStr, patientId } }),
  logDose: (data) => api.post('/schedules/log', data),
  getAdherenceStats: (patientId) => api.get('/schedules/adherence', { params: { patientId } })
};

export const caregiverApi = {
  linkPatient: (code) => api.post('/caregiver/link', { code }),
  getMonitoredPatients: () => api.get('/caregiver/patients')
};

export const emergencyApi = {
  getContacts: (patientId) => api.get('/emergency', { params: { patientId } }),
  createContact: (data) => api.post('/emergency', data),
  deleteContact: (id) => api.delete(`/emergency/${id}`)
};

export default api;
