// src/pages/ProductPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/services/api";
import type { Product, ProductVariant } from "@/types";
import { useCart } from "@/components/cart/CartProvider";
import { money } from "@/components/utils";

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { add } = useCart();
  const [p, setP] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [variantId, setVariantId] = useState<string | undefined>();
  const [coverIdx, setCoverIdx] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        // detalhe por id OU slug
        const r = await api.get(`/products/${encodeURIComponent(slug || "")}`);
        if (!active) return;
        setP(r.data as Product);
        const act = (r.data?.variants || []).filter(
          (v: ProductVariant) => v.active
        );
        if (act.length) setVariantId(act[0].id);
        setCoverIdx(0);
      } catch {
        if (active) setP(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    if (slug) load();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) return <div className="py-10 text-center">Loading…</div>;
  if (!p) return <div className="py-10 text-center">Product not found.</div>;

  // 🔒 A partir daqui o TS sabe que "p" é Product
  const product = p as Product;

  const images = product.images?.length
    ? product.images
    : product.imageUrl
    ? [product.imageUrl]
    : [];
  const cover = images[coverIdx] ?? "";

  const activeVariants = (product.variants || [])
    .filter((v) => v.active)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const selectedVariant = useMemo(
    () => activeVariants.find((v) => v.id === variantId),
    [activeVariants, variantId]
  );

  const priceVisible = product.visibility?.price !== false;
  const numericPrice = selectedVariant ? selectedVariant.price : product.price;
  const outOfStock = selectedVariant
    ? selectedVariant.stock <= 0
    : product.stock <= 0;

  function addToCart() {
    const cartId = `${product.id}::${selectedVariant?.id || "base"}`;
    const displayName = selectedVariant?.name
      ? `${product.name} — ${selectedVariant.name}`
      : product.name;
    const cartPrice = priceVisible ? numericPrice : null;
    add(
      {
        id: cartId,
        name: displayName,
        price: cartPrice as any,
        imageUrl: cover,
      },
      1
    );
  }

  return (
    <div className="mx-auto max-w-6xl py-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Galeria */}
        <div className="space-y-3">
          <div
            className="aspect-[4/3] w-full rounded-2xl border bg-neutral-100"
            style={{
              backgroundImage: `url(${cover})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(0, 8).map((src, i) => (
                <button
                  key={i}
                  onClick={() => setCoverIdx(i)}
                  className={`aspect-[4/3] w-full rounded-lg border bg-neutral-100 ${
                    coverIdx === i ? "ring-2 ring-orange-500" : ""
                  }`}
                  style={{
                    backgroundImage: `url(${src})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                  title="Preview"
                />
              ))}
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{product.name}</h1>

          {product.packageSize && (
            <div className="text-sm text-neutral-600">
              Package size: {product.packageSize}
            </div>
          )}

          {/* Variantes */}
          {activeVariants.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm">Size:</label>
              <select
                className="rounded border px-2 py-1 text-sm"
                value={variantId}
                onChange={(e) => setVariantId(e.target.value)}
              >
                {activeVariants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="text-xl font-bold">
            {priceVisible ? money.format(numericPrice) : "Request a quote"}
          </div>

          <button
            onClick={addToCart}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            disabled={outOfStock}
          >
            {outOfStock ? "Out of stock" : "Add to cart"}
          </button>

          {product.pdfUrl && (
            <div className="pt-2">
              <a
                href={product.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-emerald-700 underline"
              >
                Datasheet (PDF)
              </a>
            </div>
          )}

          <div className="prose prose-sm max-w-none">
            <p>{product.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
