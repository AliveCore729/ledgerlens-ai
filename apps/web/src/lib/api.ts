import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';

export const api = axios.create({
  // Adjust this URL if your NestJS backend runs on a different port
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://20.6.132.118.nip.io/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Attach the token to every outgoing request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Catch any 401 Unauthorized errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Session expired. Logging out...');

      // Clear the Zustand store
      // Pass an empty string to satisfy the 'string' type requirement
      useAuthStore.getState().setToken('');
      // If setUser also complains, you can use undefined, or leave it if it accepts null!
      useAuthStore.getState().setUser(null as any);

      // Force redirect to login page
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);