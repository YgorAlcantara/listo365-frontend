// src/pages/ProductPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/services/api";
import type { Product } from "@/types";
import { money } from "@/utils/money";
import { useCart } from "@/components/cart/CartProvider";
import { ArrowLeft, Loader2 } from "lucide-react";

// Extensão local opcional para variantes com imagem (não quebra seu types atual)
type VariantExtra = { imageUrl?: string | null; images?: string[] | null };

export default function ProductPage() {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const [p, setP] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedVarId, setSelectedVarId] = useState<string | null>(null);

  const { add } = useCart();

  // Se o axios `api` já tem Authorization setado (login admin), forçamos ?all=1
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

    async function load() {
      if (!idOrSlug) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setLoading(true);
      setNotFound(false);

      try {
        const r = await api.get<Product>(
          `/products/${encodeURIComponent(idOrSlug)}`,
          { params: wantsAll ? { all: 1 } : undefined }
        );
        if (!alive) return;

        const prod = r.data ?? null;
        setP(prod);
        setNotFound(!prod);

        // Seleciona a primeira variante ativa (se existir)
        if (prod?.variants && prod.variants.length) {
          const firstActive = prod.variants.find((v) => v.active !== false);
          setSelectedVarId(firstActive?.id ?? null);
        } else {
          setSelectedVarId(null);
        }
      } catch (err: any) {
        if (!alive) return;
        if (err?.response?.status === 404) {
          setNotFound(true);
        } else {
          console.error("load product failed", err);
          setNotFound(true);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [idOrSlug, wantsAll]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl py-10">
        <div className="rounded-2xl border bg-white p-6 text-sm inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  if (notFound || !p) {
    return (
      <div className="mx-auto max-w-5xl py-10">
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

  // --- Helpers baseados no produto carregado (p está garantido != null aqui) ---
  const variants = Array.isArray(p.variants) ? p.variants : [];
  const selectedVariant =
    (variants.find((v) => v.id === selectedVarId) as (typeof variants)[number] &
      VariantExtra) || null;

  const hasPrice =
    typeof p.price === "number" && Number.isFinite(p.price as number);

  // Capa: privilegia a imagem da variante, se houver; depois a do produto; depois 1px gif
  const cover =
    selectedVariant?.imageUrl ||
    (p.images && p.images.length > 0 ? p.images[0] : undefined) ||
    p.imageUrl ||
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

  // Galeria: se a variante tiver imagens, usa; senão, usa do produto
  const gallery =
    (selectedVariant?.images && selectedVariant.images.length > 0
      ? selectedVariant.images
      : p.images) || [];

  // Preço exibido: variante > produto; respeita visibilidade no backend (se oculto, virá undefined)
  const displayPrice =
    (selectedVariant?.price as number | undefined) ??
    (p.price as number | undefined);

  // Adiciona ao carrinho com id composto (productId::variantId)
  function addToCart() {
    if (!p) return;
    const v = selectedVariant;
    const variantId = v?.id ?? "base";
    const id =
      variantId && variantId !== "base" ? `${p.id}::${variantId}` : p.id;

    // Nome amigável com variante
    const name = v ? `${p.name} (${v.name})` : p.name;

    // Preço a usar (pode ser undefined se visibilidade bloqueia — então o carrinho marca como “Quote required”)
    const price =
      typeof v?.price === "number"
        ? (v.price as number)
        : typeof p.price === "number"
        ? (p.price as number)
        : undefined;

    // Imagem preferida
    const imageUrl = v?.imageUrl || cover;

    // ⚠️ NÃO envie "productId" ou "quantity" aqui — o CartProvider cuida.
    add({
      id,
      name,
      price,
      imageUrl,
    });
  }

  return (
    <div className="mx-auto max-w-6xl py-8">
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
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {gallery.slice(1, 5).map((img, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg border bg-neutral-100"
                  style={{
                    backgroundImage: `url(${img})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                  title={`Image ${i + 2}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{p.name}</h1>

          {p.category && (
            <div className="text-xs text-neutral-500">
              {p.category.parent ? `${p.category.parent.name} › ` : ""}
              {p.category.name}
            </div>
          )}

          {/* Bloco principal de preço / variant / pdf */}
          <div className="rounded-xl border bg-white p-4 space-y-3">
            {/* Preço */}
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">
                {typeof displayPrice === "number"
                  ? money.format(displayPrice)
                  : "Request a quote"}
              </div>
              {p.packageSize && (
                <div className="text-xs text-neutral-500">
                  Size: {p.packageSize}
                </div>
              )}
            </div>

            {/* Variants */}
            {variants.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-neutral-700">
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
                            "rounded-lg border px-3 py-1.5 text-xs",
                            "transition-colors",
                            isSel
                              ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                              : "border-neutral-300 hover:bg-neutral-50",
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
            {p.pdfUrl && (
              <div className="pt-2 border-t">
                <a
                  href={p.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-orange-600 underline decoration-dotted underline-offset-2 hover:text-orange-700"
                >
                  View product datasheet (PDF)
                </a>
              </div>
            )}

            {/* CTA */}
            <div className="pt-1">
              <button
                onClick={addToCart}
                className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Add to cart
              </button>
            </div>
          </div>

          {/* Descrição */}
          {p.description && (
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-line">{p.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Mais fotos (fallback para as imagens do produto se a variante não tiver galeria própria além da capa) */}
      {gallery.length > 4 && (
        <div className="mt-8">
          <h2 className="mb-2 text-lg font-semibold">More photos</h2>
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
    </div>
  );
}
