// src/pages/Home.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "@/services/api";
import type { Product } from "@/types";
import ProductCard from "@/components/ProductCard";
import { Search } from "lucide-react";
import { Hero } from "@/components/Hero";

const EXCLUDED = new Set(["bathroom cleaners", "glass cleaners"]); // case-insensitive

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [all, setAll] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [parentFilter, setParentFilter] = useState<string>("ALL");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await api.get<Product[]>("/products", {
          params: { sort: "sortOrder" },
        });
        if (!alive) return;
        setAll(Array.isArray(r.data) ? r.data : []);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.response?.data?.error || "Failed to load products");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const norm = (s?: string | null) => (s || "").trim().toLowerCase();

  // filtra inativos e categorias excluídas
  const allowed = useMemo(() => {
    return (all || []).filter((p) => {
      if (p?.active === false) return false;
      const catName = norm(p?.category?.name);
      const parentName = norm(p?.category?.parent?.name);
      if (EXCLUDED.has(catName) || EXCLUDED.has(parentName)) return false;
      return true;
    });
  }, [all]);

  // nomes de categoria-pai
  const parentNames = useMemo(() => {
    const set = new Set<string>();
    allowed.forEach((p) => {
      const top = p?.category?.parent?.name || p?.category?.name || "Other";
      set.add(top);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allowed]);

  const matchesQuery = (p: Product) => {
    if (!q.trim()) return true;
    const n = norm(p?.name);
    const d = norm(p?.description);
    const term = norm(q);
    return n.includes(term) || d.includes(term);
  };

  const topName = (p: Product) =>
    p?.category?.parent?.name || p?.category?.name || "Other";

  const visible = useMemo(
    () =>
      allowed.filter((p) => {
        if (!matchesQuery(p)) return false;
        if (parentFilter === "ALL") return true;
        return topName(p) === parentFilter;
      }),
    [allowed, q, parentFilter]
  );

  // agrupamento por subcategoria quando um pai está selecionado
  const groupedBySub = useMemo(() => {
    if (parentFilter === "ALL") return null;
    const map = new Map<string, Product[]>();
    for (const p of visible) {
      const sub = p?.category?.name || "General";
      if (!map.has(sub)) map.set(sub, []);
      map.get(sub)!.push(p);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => {
        const s = (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0);
        return s !== 0 ? s : (a?.name || "").localeCompare(b?.name || "");
      });
      map.set(k, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [visible, parentFilter]);

  return (
    <div className="space-y-6">
      {/* HERO */}
      <Hero />

      {/* Catálogo */}
      <section id="catalog" className="scroll-mt-24 space-y-6">
        {/* Busca + chips */}
        <div className="rounded-2xl border bg-white p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Busca */}
            <form
              onSubmit={(e) => e.preventDefault()}
              className="relative w-full md:w-80"
              aria-label="Search products"
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name…"
                className="w-full rounded-lg border px-9 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/60"
              />
            </form>

            {/* Chips de categoria-PAI */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                className={[
                  "rounded-full border px-3 py-1 text-sm",
                  parentFilter === "ALL"
                    ? "border-orange-600 bg-orange-50 text-orange-700"
                    : "hover:bg-neutral-50",
                ].join(" ")}
                onClick={() => setParentFilter("ALL")}
              >
                All
              </button>
              {parentNames.map((name) => (
                <button
                  key={name}
                  onClick={() => setParentFilter(name)}
                  className={[
                    "rounded-full border px-3 py-1 text-sm",
                    parentFilter === name
                      ? "border-orange-600 bg-orange-50 text-orange-700"
                      : "hover:bg-neutral-50",
                  ].join(" ")}
                  title={name}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Estados */}
        {loading && (
          <div className="rounded-2xl border bg-white p-6 text-sm text-neutral-600">
            Loading products…
          </div>
        )}
        {error && !loading && (
          <div className="rounded-2xl border bg-white p-6 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Lista */}
        {!loading && !error && (
          <>
            {parentFilter === "ALL" ? (
              visible.length === 0 ? (
                <div className="rounded-2xl border bg-white p-6 text-sm text-neutral-600">
                  No products found.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {visible
                    .sort((a, b) => {
                      const s = (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0);
                      return s !== 0
                        ? s
                        : (a?.name || "").localeCompare(b?.name || "");
                    })
                    .map((p) => {
                      const firstActiveVariant = Array.isArray(p?.variants)
                        ? p.variants.find((v) => v?.active !== false)
                        : undefined;
                      return (
                        <ProductCard
                          key={p.id}
                          id={p.id}
                          slug={p.slug || p.id}
                          name={p.name}
                          description={p.description || ""}
                          price={
                            typeof p.price === "number"
                              ? (p.price as number)
                              : undefined
                          }
                          images={p.images || []}
                          imageUrl={p.imageUrl || undefined}
                          packageSize={p.packageSize || undefined}
                          pdfUrl={p.pdfUrl || undefined}
                          stock={p.stock ?? 0}
                          sale={p.sale}
                          sku={firstActiveVariant?.sku || null}
                          category={
                            p.category
                              ? {
                                  name: p.category.name,
                                  parent: p.category.parent
                                    ? { name: p.category.parent.name }
                                    : null,
                                }
                              : null
                          }
                        />
                      );
                    })}
                </div>
              )
            ) : groupedBySub && groupedBySub.length > 0 ? (
              <div className="space-y-6">
                {groupedBySub.map(([subName, items]) => (
                  <section key={subName} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-semibold text-neutral-900">
                        {subName}
                      </h2>
                      <div className="ml-4 h-[1px] flex-1 bg-neutral-200" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {items.map((p) => {
                        const firstActiveVariant = Array.isArray(p?.variants)
                          ? p.variants.find((v) => v?.active !== false)
                          : undefined;
                        return (
                          <ProductCard
                            key={p.id}
                            id={p.id}
                            slug={p.slug || p.id}
                            name={p.name}
                            description={p.description || ""}
                            price={
                              typeof p.price === "number"
                                ? (p.price as number)
                                : undefined
                            }
                            images={p.images || []}
                            imageUrl={p.imageUrl || undefined}
                            packageSize={p.packageSize || undefined}
                            pdfUrl={p.pdfUrl || undefined}
                            stock={p.stock ?? 0}
                            sale={p.sale}
                            sku={firstActiveVariant?.sku || null}
                            category={
                              p.category
                                ? {
                                    name: p.category.name,
                                    parent: p.category.parent
                                      ? { name: p.category.parent.name }
                                      : null,
                                  }
                                : null
                            }
                          />
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border bg-white p-6 text-sm text-neutral-600">
                No products found under <b>{parentFilter}</b>.
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
