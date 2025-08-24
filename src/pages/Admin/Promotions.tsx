import { useEffect, useState } from "react";
import { api } from "@/services/api";
import EmptyState from "@/components/EmptyState";
import type { Product } from "@/types";
import { Link } from "react-router-dom";

const fmt = (v: unknown) =>
  typeof v === "number" ? `$${v.toFixed(2)}` : `$${Number(v || 0).toFixed(2)}`;

export default function Promotions() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Product[]>([]);

  async function load() {
    setLoading(true);
    try {
      const r = await api.get("/products?all=1&sort=sortOrder");
      const list: Product[] = r.data || [];
      setItems(list.filter((p) => !!p.sale)); // só com promoção ativa
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) return <div className="text-sm text-neutral-500">Loading…</div>;

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
      <h1 className="text-2xl font-bold">Promotions</h1>
      <div className="overflow-auto rounded-xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-3 py-2 text-left">Product</th>
              <th className="px-3 py-2 text-left">Price</th>
              <th className="px-3 py-2 text-left">Sale</th>
              <th className="px-3 py-2 text-left">Window</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-3 py-2">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-neutral-500 line-clamp-2">
                    {p.description}
                  </div>
                </td>
                <td className="px-3 py-2">{fmt(p.price)}</td>
                <td className="px-3 py-2">
                  {p.sale?.percentOff
                    ? `${p.sale.percentOff}% off → ${fmt(p.sale.salePrice)}`
                    : p.sale?.priceOff
                    ? `-${fmt(p.sale.priceOff)} → ${fmt(p.sale.salePrice)}`
                    : "—"}
                </td>
                <td className="px-3 py-2">
                  <div className="text-xs">
                    {new Date(p.sale!.startsAt).toLocaleString()} &nbsp;→&nbsp;{" "}
                    {new Date(p.sale!.endsAt).toLocaleString()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
