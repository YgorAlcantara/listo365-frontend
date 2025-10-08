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

function resolveBase(): string {
  const fromWindow = (typeof window !== "undefined" && window.__API_BASE__) || "";
  const fromEnv = (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_API_BASE_URL) || "";

  if (fromWindow) return normalize(fromWindow as string);
if (fromEnv) return normalize(fromEnv as string);

const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
const isLocal = host === "localhost" || host === "127.0.0.1" || host === "[::1]";

if (isLocal) return "http://localhost:4000";

// fallback de produção (caso o env falhe)
return "https://api.listo365cleaningsolutions.com";
}

let BASE_API_URL = resolveBase();

if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.log("[API] baseURL =", BASE_API_URL, "| VITE_API_BASE_URL =", (import.meta as any)?.env?.VITE_API_BASE_URL);
}

export function setApiBase(url: string) {
  BASE_API_URL = normalize(url);
  if (typeof window !== "undefined") window.__API_BASE__ = BASE_API_URL;
  api.defaults.baseURL = BASE_API_URL;
  publicApi.defaults.baseURL = BASE_API_URL;
  // eslint-disable-next-line no-console
  console.warn("[API] baseURL alterado em runtime para:", BASE_API_URL);
}

export const api = axios.create({
  baseURL: BASE_API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
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
      if (typeof window !== "undefined" && !location.pathname.startsWith("/admin/login")) {
        location.replace("/admin/login");
      }
    }
    return Promise.reject(err);
  }
);

export const publicApi = axios.create({
  baseURL: BASE_API_URL,
  withCredentials: false,
  timeout: 15000,
  headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
});