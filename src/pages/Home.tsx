import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import type { Product } from "@/types";
import { ProductCard } from "@/components/ProductCard";
import { Hero } from "@/components/Hero";
import { PromoBar } from "@/components/PromoBar";
import { SkeletonCard } from "@/components/Skeleton";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get<Product[]>("/products")
      .then((r) => {
        if (!alive) return;
        setProducts(r.data || []);
      })
      .catch((e) => {
        console.error("Failed to load products", e);
        if (alive) setProducts([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => {
      const name = (p.name ?? "").toLowerCase();
      const desc = (p.description ?? "").toLowerCase(); // may be hidden
      return name.includes(term) || desc.includes(term);
    });
  }, [q, products]);

  return (
    <div className="space-y-6">
      <PromoBar />
      <Hero />

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Products</h2>
        <input
          placeholder="Search by name or description"
          className="w-full max-w-md rounded-lg border px-3 py-2 text-sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-white p-6 text-sm text-neutral-600">
          No products found{q ? ` for “${q}”` : ""}.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              slug={p.slug}
              name={p.name}
              description={p.description}
              price={p.price}
              images={p.images}
              imageUrl={p.imageUrl}
              packageSize={p.packageSize}
              pdfUrl={p.pdfUrl}
              stock={p.stock}
            />
          ))}
        </div>
      )}
    </div>
  );
}
