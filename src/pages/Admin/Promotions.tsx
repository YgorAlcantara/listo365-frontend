// src/pages/Admin/Promotions.tsx
import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { money } from "@/utils/money";
import type { Product } from "@/types";
import { Link } from "react-router-dom";
import EmptyState from "@/components/EmptyState";

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

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const r = await api.get<Product[]>("/products?all=1&sort=sortOrder");
      const list = r.data || [];
      setItems(list.filter((p) => !!p.sale)); // only products with active sale
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.error || "Failed to load promotions");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Promotions</h1>
          <div className="h-9 w-36 animate-pulse rounded bg-neutral-200" />
        </div>
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="h-32 animate-pulse bg-neutral-100" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Couldn’t load promotions"
        subtitle={error}
        action={
          <button
            onClick={load}
            className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Try again
          </button>
        }
      />
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        title="No active promotions"
        subtitle="You can schedule promotions from the Products page."
        action={
          <Link
            to="/admin"
            className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Go to Products
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Promotions</h1>
        <button
          onClick={load}
          className="rounded border px-3 py-2 text-sm hover:bg-neutral-50"
        >
          Refresh
        </button>
      </div>

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
                  ? `${sale.percentOff}% off → ${money.format(sale.salePrice)}`
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

      <p className="text-xs text-neutral-500">
        Promotions show only when their window is active and a discount is
        defined.
      </p>
    </div>
  );
}
