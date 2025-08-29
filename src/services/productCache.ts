// src/services/productCache.ts
import { api } from "./api";
import type { Product } from "@/types";

type Entry = { data: Product; at: number };
const CACHE = new Map<string, Entry>();
const TTL = 60_000; // 60s

function keyOf(idOrSlug: string) {
  return String(idOrSlug);
}

export function getCachedProduct(idOrSlug: string): Product | null {
  const k = keyOf(idOrSlug);
  const e = CACHE.get(k);
  if (!e) return null;
  if (Date.now() - e.at > TTL) {
    CACHE.delete(k);
    return null;
  }
  return e.data;
}

export async function prefetchProduct(idOrSlug: string, wantsAll = false) {
  try {
    const k = keyOf(idOrSlug);
    if (getCachedProduct(k)) return; // já no cache fresco
    const r = await api.get<Product>(`/products/${encodeURIComponent(k)}`, {
      params: wantsAll ? { all: 1 } : undefined,
    });
    CACHE.set(k, { data: r.data, at: Date.now() });
  } catch {
    // silencioso: prefetch não deve quebrar UX
  }
}

export async function fetchProductSmart(idOrSlug: string, wantsAll = false) {
  const cached = getCachedProduct(idOrSlug);
  if (cached) return cached;
  const r = await api.get<Product>(
    `/products/${encodeURIComponent(idOrSlug)}`,
    {
      params: wantsAll ? { all: 1 } : undefined,
    }
  );
  const data = r.data;
  CACHE.set(idOrSlug, { data, at: Date.now() });
  return data;
}
