// src/services/api.ts
import axios from "axios";
import { getToken, clearToken } from "./auth";

declare global {
  interface Window {
    __API_BASE__?: string;
  }
}

// Produção: usa o proxy do Vercel (/api) para evitar CORS
const PROD_PROXY = "/api";
// Desenvolvimento local: seu backend na porta 4000
const LOCAL_DEFAULT = "http://localhost:4000";

function normalize(u: string) {
  return (u || "").trim().replace(/\/+$/, "");
}

function resolveBase(): string {
  const w = typeof window !== "undefined" ? window : undefined;

  const fromWindow = (w && w.__API_BASE__) || "";
  const fromEnv =
    (typeof import.meta !== "undefined" &&
      (import.meta as any)?.env?.VITE_API_BASE_URL) ||
    "";

  if (fromWindow) return normalize(fromWindow);
  if (fromEnv) return normalize(fromEnv as string);

  const host = w?.location?.hostname ?? "localhost";
  const isLocal =
    host === "localhost" || host === "127.0.0.1" || host === "[::1]";

  // Dev -> bate direto no backend local
  // Prod -> usa o proxy do Vercel (/api), evitando CORS
  return normalize(isLocal ? LOCAL_DEFAULT : PROD_PROXY);
}

let BASE_API_URL = resolveBase();

if (typeof window !== "undefined") {
  // Log de diagnóstico
  // eslint-disable-next-line no-console
  console.log(
    "[API] baseURL =",
    BASE_API_URL,
    "| VITE_API_BASE_URL =",
    (import.meta as any)?.env?.VITE_API_BASE_URL
  );
}

// Permite trocar a base em runtime (útil para testar sem rebuild)
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

// Cliente autenticado (admin)
export const api = axios.create({
  baseURL: BASE_API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
});

// Injeta Bearer token quando houver
api.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) {
    cfg.headers = cfg.headers ?? {};
    (cfg.headers as Record<string, string>).Authorization = `Bearer ${t}`;
  }
  return cfg;
});

// Em 401, limpa token e manda para /admin/login
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

// Cliente público (sem cookies) — usar no Checkout
export const publicApi = axios.create({
  baseURL: BASE_API_URL,
  withCredentials: false,
  timeout: 15000,
  headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
});

export { BASE_API_URL };