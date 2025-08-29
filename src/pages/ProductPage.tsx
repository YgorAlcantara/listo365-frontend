import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { api } from "@/services/api";
import type { Product } from "@/types";
import { money } from "@/utils/money";
import { useCart } from "@/components/cart/CartProvider";
import {
  ArrowLeft,
  Loader2,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { fetchProductSmart, getCachedProduct } from "@/services/productCache";

type VariantExtra = { imageUrl?: string | null; images?: string[] | null };

export default function ProductPage() {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const location = useLocation();
  const preview = (location.state as any)?.preview as
    | Partial<Product>
    | undefined;

  const [p, setP] = useState<Product | null>(() => {
    if (preview && preview.name) return (preview as Product) || null;
    if (idOrSlug) {
      const c = getCachedProduct(idOrSlug as string); // ✅ força string
      if (c) return c;
    }
    return null;
  });

  const [loading, setLoading] = useState(!p);
  const [notFound, setNotFound] = useState(false);
  const [selectedVarId, setSelectedVarId] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const syncing = useRef(false);

  const { add } = useCart();

  const wantsAll = useMemo(() => {
    const h: any = (api as any)?.defaults?.headers;
    const auth =
      h?.Authorization ||
      h?.authorization ||
      h?.common?.Authorization ||
      h?.common?.authorization;
    return Boolean(auth);
  }, []);

  useEffect(() => {
    let alive = true;
    if (!idOrSlug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    async function sync() {
      try {
        syncing.current = true;
        const prod = await fetchProductSmart(idOrSlug as string, wantsAll); // ✅ força string
        if (!alive) return;
        setP(prod);
        setNotFound(!prod);
        if (!selectedVarId && prod?.variants?.length) {
          const firstActive = prod.variants.find((v) => v.active !== false);
          setSelectedVarId(firstActive?.id ?? null);
        }
      } catch {
        if (!alive) return;
        setNotFound(true);
      } finally {
        if (alive) setLoading(false);
        syncing.current = false;
      }
    }

    if (p) {
      setLoading(false);
      sync();
    } else {
      setLoading(true);
      sync();
    }

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idOrSlug, wantsAll]);

  if (loading && !p) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="inline-flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  if (notFound || !p) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-2xl border bg-white p-6">
          <h1 className="text-xl font-semibold">Product not found</h1>
          <p className="mt-2 text-sm text-neutral-600">
            The product you’re looking for doesn’t exist or is unavailable.
          </p>
          <div className="mt-4">
            <Link
              to="/"
              className="inline-flex items-center rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const product = p as Product;

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const selectedVariant =
    (variants.find((v) => v.id === selectedVarId) as (typeof variants)[number] &
      VariantExtra) || null;

  const cover =
    selectedVariant?.imageUrl ||
    (product.images && product.images.length > 0
      ? product.images[0]
      : undefined) ||
    product.imageUrl ||
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

  const gallery =
    (selectedVariant?.images && selectedVariant.images.length > 0
      ? selectedVariant.images
      : product.images) || [];

  const basePrice =
    (selectedVariant?.price as number | undefined) ??
    (product.price as number | undefined);

  const effectivePrice =
    product.sale && !selectedVariant?.price
      ? product.sale.salePrice
      : basePrice;

  const wasPrice =
    product.sale && typeof basePrice === "number" && !selectedVariant?.price
      ? (product.price as number | undefined)
      : undefined;

  const hasNumericPrice = typeof effectivePrice === "number";

  function addToBag() {
    setJustAdded(false);
    const v = selectedVariant;
    const variantId = v?.id ?? "base";
    const id =
      variantId && variantId !== "base"
        ? `${product.id}::${variantId}`
        : product.id;

    const name = v ? `${product.name} (${v.name})` : product.name;

    const price =
      typeof v?.price === "number"
        ? (v.price as number)
        : typeof product.price === "number"
        ? (product.price as number)
        : undefined;

    const imageUrl =
      v?.imageUrl ||
      (product.images && product.images.length > 0
        ? product.images[0]
        : undefined) ||
      product.imageUrl ||
      null;

    add({
      id,
      name,
      price,
      imageUrl,
      variantId: v?.id ?? null,
      variantName: v?.name ?? null,
    });

    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1800);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Breadcrumb */}
      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
        <Link to="/" className="hover:text-neutral-700">
          Products
        </Link>
        <span className="select-none text-neutral-400">/</span>
        {product.category?.parent && (
          <>
            <span>{product.category.parent.name}</span>
            <span className="select-none text-neutral-400">/</span>
          </>
        )}
        {product.category && <span>{product.category.name}</span>}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Galeria */}
        <div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-neutral-50">
            <div
              className="h-full w-full"
              style={{
                backgroundImage: `url(${cover})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              aria-label={product.name}
            />
            {product.sale && !selectedVariant?.price ? (
              <span className="absolute left-4 top-4 rounded-full bg-orange-600/95 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                Save{" "}
                {product.sale.percentOff ? `${product.sale.percentOff}%` : ""}
                {product.sale.priceOff
                  ? ` ${money.format(product.sale.priceOff)}`
                  : ""}
              </span>
            ) : null}
          </div>

          {gallery.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {gallery.slice(1, 5).map((img, i) => (
                <div
                  key={i}
                  className="aspect-square overflow-hidden rounded-xl border bg-neutral-50"
                  title={`Image ${i + 2}`}
                >
                  <div
                    className="h-full w-full transition-transform duration-300 hover:scale-[1.04]"
                    style={{
                      backgroundImage: `url(${img})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Painel */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            {product.name}
          </h1>

          {product.description && (
            <p className="mt-2 max-w-prose text-sm text-neutral-700">
              {product.description}
            </p>
          )}

          <div className="mt-5 rounded-2xl border bg-white p-5 shadow-sm">
            {/* Preço + package size */}
            <div className="flex items-end justify-between gap-4">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-semibold text-neutral-900">
                  {hasNumericPrice
                    ? money.format(effectivePrice as number)
                    : "Request a quote"}
                </span>
                {typeof wasPrice === "number" && (
                  <span className="text-sm text-neutral-500 line-through">
                    {money.format(wasPrice)}
                  </span>
                )}
              </div>

              {product.packageSize && (
                <div className="text-xs text-neutral-500">
                  Size: {product.packageSize}
                </div>
              )}
            </div>

            {/* Variantes */}
            {variants.length > 0 && (
              <div className="mt-5">
                <div className="mb-2 text-xs font-medium text-neutral-700">
                  Select a size/variant
                </div>
                <div className="flex flex-wrap gap-2">
                  {variants
                    .filter((v) => v.active !== false)
                    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                    .map((v) => {
                      const isSel = v.id === selectedVarId;
                      const label =
                        typeof v.price === "number"
                          ? `${v.name} — ${money.format(v.price as number)}`
                          : v.name;

                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVarId(v.id)}
                          className={[
                            "rounded-lg border px-3 py-2 text-sm transition-colors",
                            isSel
                              ? "border-orange-600 bg-orange-50 text-orange-800"
                              : "border-neutral-300 text-neutral-800 hover:bg-neutral-50",
                          ].join(" ")}
                        >
                          {label}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* PDF */}
            {product.pdfUrl && (
              <div className="mt-5 rounded-xl border bg-neutral-50 p-3">
                <a
                  href={product.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-orange-700 hover:text-orange-800"
                >
                  <FileText className="h-4 w-4" />
                  View product datasheet (PDF)
                </a>
              </div>
            )}

            {/* CTA */}
            <div className="mt-5">
              {hasNumericPrice ? (
                <button
                  onClick={addToBag}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
                >
                  Add to bag
                </button>
              ) : (
                <button
                  onClick={addToBag}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-orange-600 bg-white px-4 py-3 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
                  title="Add to bag to request a quote"
                >
                  Request a quote
                </button>
              )}

              {justAdded && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                  <CheckCircle2 className="h-4 w-4" />
                  Added to bag —{" "}
                  <Link
                    to="/checkout"
                    className="underline decoration-dotted underline-offset-2 hover:text-emerald-900"
                  >
                    view bag
                  </Link>
                </div>
              )}

              <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
                <ShieldCheck className="h-4 w-4 text-orange-600" />
                Secure & fast response. Add multiple items for a combined quote.
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {product.category && (
              <div className="rounded-xl border bg-white p-4">
                <div className="text-xs font-semibold text-neutral-500">
                  Category
                </div>
                <div className="mt-1 text-sm text-neutral-900">
                  {product.category.parent
                    ? `${product.category.parent.name} → `
                    : ""}
                  {product.category.name}
                </div>
              </div>
            )}
            {typeof product.stock === "number" && (
              <div className="rounded-xl border bg-white p-4">
                <div className="text-xs font-semibold text-neutral-500">
                  Availability
                </div>
                <div className="mt-1 text-sm text-neutral-900">
                  {product.stock > 0 ? "In stock" : "Made to order"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {gallery.length > 4 && (
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">
            More photos
          </h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {gallery.slice(4).map((img, i) => (
              <div
                key={i}
                className="aspect-[4/3] rounded-xl border bg-neutral-100"
                style={{
                  backgroundImage: `url(${img})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            ))}
          </div>
        </div>
      )}
      <div className="mt-2 text-xs text-neutral-500">
        {syncing.current ? "Updating details…" : "\u00A0"}
      </div>
    </div>
  );
}
