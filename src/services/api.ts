// src/services/api.ts
import axios from "axios";
import { getToken, clearToken } from "./auth";

const base =
  (import.meta as any)?.env?.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:4000";

export const api = axios.create({
  baseURL: base,
  withCredentials: true,
  timeout: 12000,
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) {
    cfg.headers = cfg.headers ?? {};
    (cfg.headers as Record<string, string>).Authorization = `Bearer ${t}`;
  }
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // expira/sem permissão -> derruba sessão e envia p/ login admin
    if (err?.response?.status === 401) {
      clearToken();
      if (!location.pathname.startsWith("/admin/login")) {
        location.replace("/admin/login");
      }
    }
    return Promise.reject(err);
  }
);
