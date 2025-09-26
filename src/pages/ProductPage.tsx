import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { getToken } from "@/services/auth";
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
type Variant = NonNullable<Product["variants"]>[number] & VariantExtra;

export default function ProductPage() {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const location = useLocation();
  const preview = (location.state as any)?.preview as
    | Partial<Product>
    | undefined;

  const [p, setP] = useState<Product | null>(() => {
    if (preview && preview.name) return (preview as Product) || null;
    if (idOrSlug) {
      const c = getCachedProduct(idOrSlug as string);
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
  const wantsAll = useMemo(() => Boolean(getToken()), []);

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
        const prod = await fetchProductSmart(idOrSlug as string, wantsAll);
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
  }, [idOrSlug, wantsAll]);

  if (loading && !p) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="inline-flex items-center gap-2 rounded-2xl border bg-white px-4 py-3 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  if (notFound || !p) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
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

  // ===== Dados =====
  const product = p as Product;
  const variants: Variant[] = Array.isArray(product.variants)
    ? (product.variants as Variant[])
    : [];

  const activeVariants = variants
    .filter((v) => v.active !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const selectedVariant: Variant | null =
    (activeVariants.find((v) => v.id === selectedVarId) as
      | Variant
      | undefined) ??
    (activeVariants[0] as Variant | undefined) ??
    null;

  function variantCover(v?: Variant | null): string {
    if (v) {
      const fromArray =
        v.images && v.images.length > 0 ? v.images[0] : undefined;
      return (
        fromArray ||
        v.imageUrl ||
        product.imageUrl ||
        (product.images && product.images[0]) ||
        "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
      );
    }
    return (
      product.imageUrl ||
      (product.images && product.images[0]) ||
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="
    );
  }

  const mainImage = variantCover(selectedVariant);

  // Preço efetivo (respeitando visibilidade)
  const variantPrice = selectedVariant?.price;
  const basePrice = product.price as number | undefined;
  const effectivePrice =
    typeof variantPrice === "number"
      ? variantPrice
      : product.sale
      ? product.sale.salePrice
      : basePrice;

  const wasPrice =
    !selectedVariant?.price && product.sale && typeof basePrice === "number"
      ? basePrice
      : undefined;

  const hasNumericPrice =
    product.visibility?.price === true && typeof effectivePrice === "number";

  function onSelectVariant(id: string) {
    setSelectedVarId(id);
  }

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

    const imageUrl = variantCover(v) || null;

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

  const imgBox =
    "relative aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-white";
  const imgEl = "absolute inset-0 h-full w-full object-contain p-3";
  const thumbBtn =
    "relative overflow-hidden rounded-lg border bg-white hover:shadow-sm transition ring-1 ring-inset ring-neutral-200 hover:ring-orange-300";
  const thumbImg = "h-full w-full object-contain p-1";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Breadcrumb */}
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
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

      {/* Título */}
      <h1 className="mb-5 text-3xl font-bold tracking-tight text-neutral-900">
        {product.name}
      </h1>

      <div className="grid items-start gap-8 md:grid-cols-2">
        {/* Esquerda */}
        <div>
          <div className={imgBox}>
            <img
              src={mainImage}
              alt={product.name}
              className={imgEl}
              loading="eager"
              referrerPolicy="no-referrer"
            />
            {product.sale && !selectedVariant?.price ? (
              <span className="absolute left-3 top-3 rounded-full bg-orange-600/95 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                Save{" "}
                {product.sale.percentOff ? `${product.sale.percentOff}%` : ""}
                {product.sale.priceOff
                  ? ` ${money.format(product.sale.priceOff)}`
                  : ""}
              </span>
            ) : null}
          </div>

          {/* thumbs */}
          <div className="mt-3">
            <div className="flex gap-2 overflow-x-auto">
              {activeVariants.length > 0
                ? activeVariants.map((v) => {
                    const isSel = v.id === selectedVarId;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => onSelectVariant(v.id)}
                        className={[
                          thumbBtn,
                          isSel ? "ring-2 ring-orange-500" : "",
                        ].join(" ")}
                        style={{ width: 60, height: 60 }}
                        title={v.name}
                      >
                        <img
                          src={variantCover(v)}
                          alt={v.name}
                          className={thumbImg}
                          loading="lazy"
                        />
                      </button>
                    );
                  })
                : (product.images || []).slice(0, 8).map((img, i) => (
                    <div
                      key={i}
                      className={thumbBtn}
                      style={{ width: 60, height: 60 }}
                      title={`Image ${i + 1}`}
                    >
                      <img
                        src={img}
                        alt={`Image ${i + 1}`}
                        className={thumbImg}
                      />
                    </div>
                  ))}
            </div>
          </div>
        </div>

        {/* Direita */}
        <div>
          <div className="h-full w-full">
            <div className="rounded-2xl border bg-white shadow-sm flex flex-col p-4 md:p-6 lg:p-8">
              {/* Preço */}
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

              {/* SKU */}
              <div className="mt-2 text-xs text-neutral-500">
                <b className="text-neutral-700">SKU:</b>{" "}
                {selectedVariant?.sku?.trim() || "—"}
              </div>

              {/* Variantes */}
              {activeVariants.length > 0 && (
                <div className="mt-4">
                  <div className="mb-1 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                    Size / Variant
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeVariants.map((v) => {
                      const isSel = v.id === selectedVarId;
                      const label =
                        typeof v.price === "number" && product.visibility?.price
                          ? `${v.name} — ${money.format(v.price as number)}`
                          : v.name;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => onSelectVariant(v.id)}
                          className={[
                            "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                            isSel
                              ? "border-orange-600 bg-orange-50 text-orange-800"
                              : "border-neutral-300 text-neutral-800 hover:bg-neutral-50",
                          ].join(" ")}
                          title={v.name}
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
                <div className="mt-4 rounded-xl border bg-neutral-50 p-3">
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

              {/* Categoria */}
              {product.category && (
                <div className="mt-4 rounded-xl border bg-neutral-50 p-3">
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

              {/* CTA */}
              <div className="mt-auto">
                <div className="mt-4">
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
                    Secure & fast response. Add multiple items for a combined
                    quote.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Descrição */}
      {product.description && (
        <div className="mt-8">
          <h2 className="mb-2 text-lg font-semibold text-neutral-900">
            Description
          </h2>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-line text-justify">
              {product.description}
            </p>
          </div>
        </div>
      )}

      <div className="mt-2 text-xs text-neutral-500">
        {syncing.current ? "Updating details…" : "\u00A0"}
      </div>
    </div>
  );
}
