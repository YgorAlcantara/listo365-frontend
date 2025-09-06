// frontend/src/services/api.ts
import axios from "axios";
import { getToken, clearToken } from "./auth";

/**
 * Ordem de resolução do baseURL:
 * 1) window.__API_BASE__ (permite trocar via console se quiser)
 * 2) import.meta.env.VITE_API_BASE_URL (env do Vite)
 * 3) fallback: Render (produção) -> https://listo365-backend.onrender.com
 */
declare global {
  interface Window {
    __API_BASE__?: string;
  }
}

const fromWindow = (typeof window !== "undefined" && window.__API_BASE__) || "";
const fromEnv = ((import.meta as any)?.env?.VITE_API_BASE_URL as string) || "";

const base = (fromWindow || fromEnv || "https://listo365-backend.onrender.com")
  .trim()
  .replace(/\/+$/, "");

console.log(
  "[API] baseURL =",
  base,
  "| VITE_API_BASE_URL =",
  (import.meta as any)?.env?.VITE_API_BASE_URL
);

// Cliente autenticado (admin)
export const api = axios.create({
  baseURL: base,
  withCredentials: true,
  timeout: 15000,
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

// Cliente público (sem cookies) — usar no Checkout
export const publicApi = axios.create({
  baseURL: base,
  withCredentials: false,
  timeout: 15000,
  headers: { Accept: "application/json" },
});
