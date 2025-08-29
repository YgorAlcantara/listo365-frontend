// src/pages/Admin/Promotions.tsx
import { useEffect, useRef, useState } from "react";
import { api } from "@/services/api";
import { money } from "@/utils/money";
import type { Product } from "@/types";
import { Link } from "react-router-dom";

function fmtDateRange(startsAt?: string, endsAt?: string) {
  if (!startsAt || !endsAt) return "—";
  const s = new Date(startsAt).toLocaleString();
  const e = new Date(endsAt).toLocaleString();
  return `${s} → ${e}`;
}

export default function Promotions() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reqIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  async function load() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const myId = ++reqIdRef.current;

    setLoading(true);
    setError(null);
    try {
      const r = await api.get<Product[]>("/products", {
        params: { all: 1, sort: "sortOrder" },
        signal: controller.signal as any,
      });
      if (myId !== reqIdRef.current) return;
      const list = r.data || [];
      setItems(list.filter((p) => !!p.sale));
    } catch (e: any) {
      if (e?.name === "CanceledError" || e?.message === "canceled") return;
      setError(e?.response?.data?.error || "Failed to load promotions");
      setItems([]);
    } finally {
      if (myId === reqIdRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold"></h1>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
          <Link
            to="/admin"
            className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            Go to Products
          </Link>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && !error && (
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="h-10 bg-neutral-50" />
          <div className="h-24 animate-pulse bg-neutral-100" />
          <div className="h-24 animate-pulse bg-neutral-100 border-t" />
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="text-sm font-semibold text-rose-800">
            Couldn’t load promotions
          </div>
          <div className="mt-1 text-sm text-rose-700">{error}</div>
          <div className="mt-3">
            <button
              onClick={load}
              className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <div className="rounded-2xl border bg-white p-6 text-center">
          <div className="text-lg font-semibold">No active promotions</div>
          <p className="mt-1 text-sm text-neutral-600">
            You can schedule promotions from the Products page.
          </p>
          <div className="mt-3">
            <Link
              to="/admin"
              className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              Go to Products
            </Link>
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && !error && items.length > 0 && (
        <div className="overflow-auto rounded-xl border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-3 py-2 text-left">Product</th>
                <th className="px-3 py-2 text-left">Base price</th>
                <th className="px-3 py-2 text-left">Sale</th>
                <th className="px-3 py-2 text-left">Window</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const sale = p.sale!;
                const base =
                  typeof p.price === "number" ? money.format(p.price) : "—";
                const saleLabel =
                  sale.percentOff != null
                    ? `${sale.percentOff}% off → ${money.format(
                        sale.salePrice
                      )}`
                    : sale.priceOff != null
                    ? `-${money.format(sale.priceOff)} → ${money.format(
                        sale.salePrice
                      )}`
                    : "—";

                return (
                  <tr key={p.id} className="border-t">
                    <td className="px-3 py-2">
                      <div className="font-medium">{p.name}</div>
                      <div className="line-clamp-2 text-xs text-neutral-500">
                        {p.description}
                      </div>
                    </td>
                    <td className="px-3 py-2">{base}</td>
                    <td className="px-3 py-2">{saleLabel}</td>
                    <td className="px-3 py-2 text-xs">
                      {fmtDateRange(sale.startsAt, sale.endsAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-neutral-500">
        Promotions show only when their window is active and a discount is
        defined.
      </p>
    </div>
  );
}
