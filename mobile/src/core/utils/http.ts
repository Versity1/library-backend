import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../constants/api';
import { TokenStorage } from './storage';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  async (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    const token = await TokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => { console.log('[API] Request error:', error.message); return Promise.reject(error); }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] Response from ${response.config.url}: ${response.status}`);
    return response;
  },
  async (error) => {
    console.log('[API] Response error:', error.message, error.response?.data);
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await TokenStorage.getRefreshToken();
        if (refreshToken) {
          const res = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, {
            refresh: refreshToken,
          });
          const newAccessToken = res.data.access;
          await TokenStorage.setTokens(newAccessToken, refreshToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        await TokenStorage.clearAuth();
      }
    }
    return Promise.reject(error);
  }
);
