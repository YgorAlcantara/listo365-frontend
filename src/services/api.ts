// src/services/api.ts
import axios from "axios";
import { getToken, clearToken } from "./auth";

function pickBaseURL() {
  const raw = (import.meta as any)?.env?.VITE_API_BASE_URL;
  const envBase = typeof raw === "string" && raw.trim() ? raw.trim() : "";
  const normalized = envBase ? envBase.replace(/\/+$/, "") : "";

  // fallback só se NÃO houver env
  const fallback = "http://localhost:4000";
  const base = normalized || fallback;

  // log útil no dev: veja no console se está vindo do Render ou do localhost
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info(
      `[API] baseURL = ${base} ${
        normalized ? "(from VITE_API_BASE_URL)" : "(fallback localhost)"
      }`
    );
  }
  return base;
}

export const api = axios.create({
  baseURL: pickBaseURL(),
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
    if (err?.response?.status === 401) {
      clearToken();
      if (!location.pathname.startsWith("/admin/login")) {
        location.replace("/admin/login");
      }
    }
    return Promise.reject(err);
  }
);