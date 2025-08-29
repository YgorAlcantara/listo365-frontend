import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import type { Product } from "@/types";
import { ProductCard } from "@/components/ProductCard";
import { Hero } from "@/components/Hero";
import { PromoBar } from "@/components/PromoBar";
import { SkeletonCard } from "@/components/Skeleton";
import GetInTouch from "@/components/GetInTouch";
import Footer from "@/components/Footer";

type Cat = { id: string; name: string; slug: string; children?: Cat[] };

const P_CACHE = "home.products.v1";
const C_CACHE = "home.categories.v1";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cats, setCats] = useState<Cat[]>([]);
  const [parentId, setParentId] = useState<string>("all");

  function read<T>(key: string): T | null {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }
  function write<T>(key: string, val: T) {
    try {
      sessionStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }

  useEffect(() => {
    // mostra cache na hora (se houver)
    const pc = read<Product[]>(P_CACHE);
    const cc = read<Cat[]>(C_CACHE);
    if (pc) {
      setProducts(pc);
      setLoading(false);
    }
    if (cc) setCats(cc);

    // revalida em background
    Promise.all([
      api.get<Product[]>("/products"),
      api.get<Cat[]>("/categories"),
    ])
      .then(([p, c]) => {
        setProducts(p.data || []);
        write(P_CACHE, p.data || []);
        setCats(c.data || []);
        write(C_CACHE, c.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const parents = useMemo(
    () =>
      cats.map((c) => ({ id: c.id, name: c.name, children: c.children || [] })),
    [cats]
  );

  const textFiltered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(term) ||
        (p.description || "").toLowerCase().includes(term)
    );
  }, [q, products]);

  const gridAll = useMemo(() => {
    if (parentId !== "all") return [];
    return textFiltered;
  }, [textFiltered, parentId]);

  const segments = useMemo(() => {
    if (parentId === "all") return [];
    const parent = parents.find((p) => p.id === parentId);
    if (!parent) return [];

    const children = parent.children;
    const byChild: { title: string; items: Product[] }[] = [];

    for (const s of children) {
      const items = textFiltered.filter((p) => p.category?.id === s.id);
      if (items.length) byChild.push({ title: s.name, items });
    }

    const direct = textFiltered
      .filter(
        (p) =>
          p.category?.id === parentId || p.category?.parent?.id === parentId
      )
      .filter((p) => !children.some((s) => s.id === p.category?.id));
    if (direct.length) byChild.unshift({ title: "Other", items: direct });

    return byChild;
  }, [parentId, parents, textFiltered]);

  return (
    <div className="space-y-8">
      <PromoBar />
      <Hero />

      {/* header + busca */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">Products</h2>
          <input
            placeholder="Search by name or description"
            className="w-full max-w-md rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* filtro por parent (chips) */}
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          <button
            onClick={() => setParentId("all")}
            className={[
              "whitespace-nowrap rounded-full border px-3 py-1.5 text-sm",
              parentId === "all"
                ? "border-orange-500 bg-orange-50 text-orange-700"
                : "border-neutral-300 hover:bg-neutral-50",
            ].join(" ")}
          >
            All
          </button>
          {parents.map((p) => (
            <button
              key={p.id}
              onClick={() => setParentId(p.id)}
              className={[
                "whitespace-nowrap rounded-full border px-3 py-1.5 text-sm",
                parentId === p.id
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : "border-neutral-300 hover:bg-neutral-50",
              ].join(" ")}
              title={p.name}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* listagem */}
      <section id="catalog" className="space-y-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : parentId === "all" ? (
          gridAll.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
              No products found{q ? ` for “${q}”` : ""}.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {gridAll.map((p) => (
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
          )
        ) : (
          // parent selecionado — ver regra de layout
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {segments.length === 0 ? (
              <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 md:col-span-2">
                No products in this category{q ? ` for “${q}”` : ""}.
              </div>
            ) : (
              segments.map((seg, idx) => {
                const single = seg.items.length === 1;
                return (
                  <div
                    key={idx}
                    className={[
                      "rounded-2xl border bg-white p-4",
                      single ? "" : "md:col-span-2",
                    ].join(" ")}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-neutral-900">
                        {seg.title}
                      </h3>
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                        {seg.items.length}
                      </span>
                    </div>

                    {single ? (
                      <div className="grid grid-cols-1">
                        {seg.items.map((p) => (
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
                    ) : (
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {seg.items.map((p) => (
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
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>
    </div>
  );
}
