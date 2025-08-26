import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/services/api";
import type { Product } from "@/types";
import { money } from "@/utils/money";
import { useCart } from "@/components/cart/CartProvider";

export default function ProductPage() {
  // Compatível com :idOrSlug e :idOrslug (rota atual)
  const params = useParams();
  const idOrSlug = (params as any).idOrSlug ?? (params as any).idOrslug;

  const [p, setP] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { add } = useCart();

  // Se admin (axios com Authorization), força ?all=1
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
        setP(r.data ?? null);
        setNotFound(!r.data);
      } catch {
        if (!alive) return;
        setNotFound(true);
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
        <div className="rounded-2xl border bg-white p-6 text-sm">Loading…</div>
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
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ✅ daqui pra frente, use `product` (não `p`) para o TypeScript entender que não é null
  const product = p as Product;

  const cover =
    (product.images && product.images.length > 0
      ? product.images[0]
      : undefined) ??
    product.imageUrl ??
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

  const hasPrice =
    typeof product.price === "number" && Number.isFinite(product.price);

  const addToCart = () => {
    const price = hasPrice ? (product.price as number) : Number.NaN; // NaN -> unpriced workflow
    const id = `${product.id}::base`;
    add({ id, name: product.name, price, imageUrl: cover }, 1);
  };

  return (
    <div className="mx-auto max-w-6xl py-8">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Gallery */}
        <div className="space-y-3">
          <div
            className="aspect-[4/3] w-full rounded-2xl border bg-neutral-100"
            style={{
              backgroundImage: `url(${cover})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1, 5).map((img, i) => (
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
          <h1 className="text-2xl font-bold">{product.name}</h1>

          {product.category && (
            <div className="text-xs text-neutral-500">
              {product.category.parent
                ? `${product.category.parent.name} › `
                : ""}
              {product.category.name}
            </div>
          )}

          <div className="rounded-2xl border bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">
                {hasPrice
                  ? money.format(product.price as number)
                  : "Request a quote"}
              </div>
              {product.packageSize && (
                <div className="text-xs text-neutral-500">
                  Size: {product.packageSize}
                </div>
              )}
            </div>

            {product.pdfUrl && (
              <div className="mt-2">
                <a
                  href={product.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-orange-600 underline decoration-dotted underline-offset-2 hover:text-orange-700"
                >
                  View product datasheet (PDF)
                </a>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={addToCart}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                {hasPrice ? "Add to cart" : "Request a quote"}
              </button>
              <Link
                to="/checkout"
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:border-emerald-500 hover:text-emerald-700"
              >
                Go to checkout
              </Link>
            </div>
          </div>

          {product.description && (
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-line">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {product.images && product.images.length > 4 && (
        <div className="mt-8">
          <h2 className="mb-2 text-lg font-semibold">More photos</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {product.images.slice(4).map((img, i) => (
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
