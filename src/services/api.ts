// frontend/src/services/api.ts
import axios from "axios";
import { getToken, clearToken } from "./auth";

/**
 * Ordem de resolução do baseURL:
 * 1) window.__API_BASE__            (permite trocar via console ou setApiBase)
 * 2) import.meta.env.VITE_API_BASE_URL (definida no build do Vite)
 * 3) fallback:
 *    - localhost -> http://localhost:3000
 *    - produção  -> PROD_DEFAULT (defina seu domínio da API)
 *    - (último recurso) Render -> https://listo365-backend.onrender.com
 */
declare global {
  interface Window {
    __API_BASE__?: string;
  }
}

const RENDER_FALLBACK = "https://listo365-backend.onrender.com";
// 🔁 defina seu domínio oficial de API aqui (evita CORS e facilita CDN/WAF)
const PROD_DEFAULT = "/api";

function normalize(u: string) {
  return (u || "").trim().replace(/\/+$/, "");
}

function resolveBase(): string {
  const fromWindow =
    (typeof window !== "undefined" && window.__API_BASE__) || "";
  const fromEnv =
    (typeof import.meta !== "undefined" &&
      (import.meta as any)?.env?.VITE_API_BASE_URL) ||
    "";

  const host =
    typeof window !== "undefined" ? window.location.hostname : "localhost";
  const isLocal =
    host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  const isProd = !isLocal;

  // 1) window override
  if (fromWindow) return normalize(fromWindow);

  // 2) env do Vite
  if (fromEnv) return normalize(fromEnv as string);

  // 3) fallbacks
  if (isLocal) {
    return normalize("http://localhost:3000");
  }

  // Produção sem env definida → usar domínio oficial se existir
  // (troque PROD_DEFAULT para o seu; se ainda não tiver, deixamos Render como último recurso)
  const prod = normalize(PROD_DEFAULT);
  if (prod && prod !== "https://api.seu-dominio-aqui.com") {
    return prod;
  }

  // Último recurso (NÃO IDEAL): Render → sujeito a CORS se o backend não liberar o seu origin
  return normalize(RENDER_FALLBACK);
}

let BASE_API_URL = resolveBase();

if (typeof window !== "undefined") {
  const origin = window.location.origin;
  // Se caiu no fallback Render em produção, avisa bem alto
  if (
    !window.__API_BASE__ &&
    !(import.meta as any)?.env?.VITE_API_BASE_URL &&
    BASE_API_URL === normalize(RENDER_FALLBACK) &&
    !origin.includes("localhost")
  ) {
    // eslint-disable-next-line no-console
    console.error(
      "[API] ATENÇÃO: usando fallback da Render em produção. Defina VITE_API_BASE_URL (ou configure proxy /api) e habilite CORS no backend."
    );
  }

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

// Bearer token
api.interceptors.request.use((cfg) => {
  const t = getToken();
  if (t) {
    cfg.headers = cfg.headers ?? {};
    (cfg.headers as Record<string, string>).Authorization = `Bearer ${t}`;
  }
  return cfg;
});

// Redireciona 401 para login admin
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

// Cliente público (sem cookies) — usar no Checkout
export const publicApi = axios.create({
  baseURL: BASE_API_URL,
  withCredentials: false,
  timeout: 15000,
  headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
});