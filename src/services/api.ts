// frontend/src/services/api.ts
import axios from "axios";
import { getToken, clearToken } from "./auth";

/**
 * Prioridade para resolver a base da API:
 * 1) window.__API_BASE__              (override em runtime/debug)
 * 2) import.meta.env.VITE_API_BASE_URL (definida no build do Vite)
 * 3) fallback:
 *    - local dev  -> http://localhost:3000  (backend local)
 *    - produção   -> /api                   (rewrite do Vercel → backend)
 *    - último recurso -> https://listo365-backend.onrender.com (pode gerar CORS)
 */
declare global {
  interface Window {
    __API_BASE__?: string;
  }
}

const RENDER_FALLBACK = "https://listo365-backend.onrender.com";
const PROD_DEFAULT = "/api"; // usa o rewrite do Vercel (mesmo domínio do front)

function normalize(u: string) {
  return (u || "").trim().replace(/\/+$/, "");
}

function isLocalHost(host: string) {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]"
  );
}

function resolveBase(): string {
  const isBrowser = typeof window !== "undefined";

  // 1) override por window
  const fromWindow = isBrowser ? (window.__API_BASE__ || "") : "";
  if (fromWindow) return normalize(fromWindow);

  // 2) env do Vite
  const fromEnv =
    (typeof import.meta !== "undefined" &&
      (import.meta as any)?.env?.VITE_API_BASE_URL) ||
    "";
  if (fromEnv) return normalize(fromEnv as string);

  // 3) fallbacks por ambiente
  const host = isBrowser ? window.location.hostname : "localhost";
  const local = isLocalHost(host);

  if (local) {
    // Backend local exposto em 3000 (ajuste se for outro)
    return normalize("http://localhost:3000");
  }

  // Produção → SEMPRE tente /api (rewrite no vercel.json)
  // vercel.json:
  // {
  //   "rewrites": [
  //     { "source": "/api/(.*)", "destination": "https://listo365-backend.onrender.com/$1" },
  //     ...
  //   ]
  // }
  const prod = normalize(PROD_DEFAULT);
  if (prod) return prod;

  // Último recurso (não ideal): direto no Render (sujeito a CORS)
  return normalize(RENDER_FALLBACK);
}

let BASE_API_URL = resolveBase();

function logDiagnostics() {
  const isBrowser = typeof window !== "undefined";
  const viteEnv = (import.meta as any)?.env?.VITE_API_BASE_URL;

  if (isBrowser) {
    // Log de diagnóstico
    // eslint-disable-next-line no-console
    console.log("[API] baseURL =", BASE_API_URL, "| VITE_API_BASE_URL =", viteEnv);

    const origin = window.location.origin;
    const usingRenderFallback = BASE_API_URL === normalize(RENDER_FALLBACK);

    if (!window.__API_BASE__ && !viteEnv && usingRenderFallback && !origin.includes("localhost")) {
      // eslint-disable-next-line no-console
      console.error(
        "[API] ATENÇÃO: em produção e usando fallback direto da Render. " +
          "Prefira /api com rewrite (vercel.json) ou defina VITE_API_BASE_URL para evitar CORS."
      );
    }

    if (BASE_API_URL.startsWith("http")) {
      const sameOrigin = BASE_API_URL.startsWith(origin);
      if (!sameOrigin && !BASE_API_URL.startsWith("http://localhost")) {
        // eslint-disable-next-line no-console
        console.warn(
          "[API] Observação: baseURL é cross-origin. Se o backend não liberar CORS para este domínio, " +
            "as requisições serão bloqueadas pelo navegador."
        );
      }
    } else {
      // base relativa (/api) → melhor caminho (mesma origem)
      // eslint-disable-next-line no-console
      console.info("[API] Usando base relativa (mesma origem). Sem CORS 🎉");
    }
  }
}

logDiagnostics();

// Helpers para inspecionar/alterar em runtime
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
  withCredentials: true, // se não usar cookies/sessão, pode desligar
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
      if (typeof window !== "undefined" && !location.pathname.startsWith("/admin/login")) {
        location.replace("/admin/login");
      }
    }
    return Promise.reject(err);
  }
);

// Cliente público (sem cookies) — ex.: checkout
export const publicApi = axios.create({
  baseURL: BASE_API_URL,
  withCredentials: false,
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});