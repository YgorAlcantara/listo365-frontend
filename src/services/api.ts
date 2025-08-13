import axios from 'axios';
import { getToken } from './auth'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
});

api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers['Authorization'] = `Bearer ${t}`;
  return config;
});
