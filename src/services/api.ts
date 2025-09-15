// frontend/src/services/api.ts
import axios from "axios";
import { getToken, clearToken } from "./auth";

declare global {
  interface Window {
    __API_BASE__?: string;
  }
}

function normalize(u: string) {
  return (u || "").trim().replace(/\/+$/, "");
}

function isLocalHost(host: string) {
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

function resolveBase(): string {
  const isBrowser = typeof window !== "undefined";

  // 1) override por window (debug rápido no console: setApiBase('...'))
  const winBase = isBrowser ? window.__API_BASE__ : "";
  if (winBase) return normalize(winBase);

  // 2) env do Vite (use só no dev local; no Vercel deixe vazio)
  const envBase =
    (typeof import.meta !== "undefined" &&
      (import.meta as any)?.env?.VITE_API_BASE_URL) ||
    "";
  if (envBase) return normalize(envBase as string);

  // 3) fallback: dev local -> localhost; produção/preview -> /api
  if (!isBrowser) return "/api"; // SSR/estático

  const host = window.location.hostname;
  if (isLocalHost(host)) return "http://localhost:3000";

  return "/api";
}

let BASE_API_URL = resolveBase();

// Log de diagnóstico
(function logDiagnostics() {
  const viteEnv = (import.meta as any)?.env?.VITE_API_BASE_URL;
  // eslint-disable-next-line no-console
  console.log("[API] baseURL =", BASE_API_URL, "| VITE_API_BASE_URL =", viteEnv);

  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    if (
      BASE_API_URL.startsWith("http") &&
      !BASE_API_URL.startsWith(origin) &&
      !BASE_API_URL.startsWith("http://localhost")
    ) {
      // eslint-disable-next-line no-console
      console.warn(
        "[API] baseURL é cross-origin. Se o backend não liberar CORS, vai quebrar."
      );
    }
    if (!BASE_API_URL.startsWith("http")) {
      // eslint-disable-next-line no-console
      console.info("[API] Usando base relativa (mesma origem). Sem CORS 🎉");
    }
  }
})();

// Helpers
export function getApiBase() {
  return BASE_API_URL;
}

export function setApiBase(url: string) {
  BASE_API_URL = normalize(url);
  if (typeof window !== "undefined") {
    window.__API_BASE__ = BASE_API_URL;
  }
  api.defaults.baseURL = BASE_API_URL;
  publicApi.defaults.baseURL = BASE_API_URL;
  // eslint-disable-next-line no-console
  console.warn("[API] baseURL alterado em runtime para:", BASE_API_URL);
}

// === Axios clients ===

// Cliente autenticado (admin)
export const api = axios.create({
  baseURL: BASE_API_URL,
  withCredentials: true, // se não usa cookie/sessão, pode ser false
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

// Injeta Bearer token (se houver)
api.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) {
    cfg.headers = cfg.headers ?? {};
    (cfg.headers as Record<string, string>).Authorization = `Bearer ${t}`;
  }
  return cfg;
});

// Se 401 → limpa token e manda para login admin
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      clearToken();
      if (
        typeof window !== "undefined" &&
        !location.pathname.startsWith("/admin/login")
      ) {
        location.replace("/admin/login");
      }
    }
    return Promise.reject(err);
  }
);

// Cliente público (sem cookies)
export const publicApi = axios.create({
  baseURL: BASE_API_URL,
  withCredentials: false,
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});