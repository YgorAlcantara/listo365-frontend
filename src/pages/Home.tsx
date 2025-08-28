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
    let mounted = true;
    setLoading(true);
    api
      .get<Product[]>("/products")
      .then((r) => {
        if (mounted) setProducts(r.data || []);
      })
      .catch((e) => {
        console.error("Failed to load products", e);
        if (mounted) setProducts([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => {
      const name = (p.name ?? "").toLowerCase();
      const desc = (p.description ?? "").toLowerCase();
      return name.includes(term) || desc.includes(term);
    });
  }, [q, products]);

  return (
    <div className="space-y-8">
      <PromoBar />
      <Hero />

      {/* header da listagem + search */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-neutral-900">Products</h2>
        <input
          placeholder="Search by name or description"
          className="w-full max-w-md rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* grid com id para o botão do Hero rolar até aqui */}
      <section id="catalog">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
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
                sale={p.sale}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
