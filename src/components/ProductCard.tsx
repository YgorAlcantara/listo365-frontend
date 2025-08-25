import { motion } from "framer-motion";
import { useCart } from "@/components/cart/CartProvider";
import { money } from "@/components/utils";
import type { ProductVariant, ProductVisibility } from "@/types";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

type Props = {
  id: string;
  slug?: string;
  name: string;
  description: string;
  price: number; // baseline
  images?: string[];
  imageUrl?: string | null;
  packageSize?: string | null;
  pdfUrl?: string | null;
  stock?: number;
  visibility?: ProductVisibility; // para saber se mostra o preço
  variants?: ProductVariant[]; // tamanhos/opções
};

export function ProductCard({
  id,
  slug,
  name,
  description,
  price,
  images,
  imageUrl,
  packageSize,
  pdfUrl,
  stock,
  visibility,
  variants,
}: Props) {
  const { add } = useCart();
  const cover =
    (images && images.length > 0 ? images[0] : undefined) ??
    imageUrl ??
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

  const activeVariants = useMemo(
    () =>
      (variants || [])
        .filter((v) => v.active)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [variants]
  );

  const [variantId, setVariantId] = useState<string | undefined>(
    activeVariants.length ? activeVariants[0].id : undefined
  );

  const selectedVariant = useMemo(
    () => activeVariants.find((v) => v.id === variantId),
    [activeVariants, variantId]
  );

  const outOfStock = (() => {
    if (selectedVariant) return selectedVariant.stock <= 0;
    if (typeof stock === "number") return stock <= 0;
    return false;
  })();

  const priceVisible = visibility?.price !== false;
  const numericPrice = selectedVariant ? selectedVariant.price : price;
  const showPriceText = priceVisible && Number.isFinite(numericPrice);

  const variantName = selectedVariant?.name;
  const cartId = `${id}::${variantId || "base"}`; // item único por variante

  function addToCart() {
    const cartPrice = priceVisible ? numericPrice : null; // quando oculto, entra sem preço
    const displayName = variantName ? `${name} — ${variantName}` : name;
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
    <motion.article
      whileHover={{ y: -2 }}
      className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition"
    >
      <Link to={slug ? `/product/${slug}` : "#"} className="block">
        <div
          className="relative aspect-[4/3] w-full bg-neutral-100"
          style={{
            backgroundImage: `url(${cover})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </Link>

      <div className="space-y-3 p-4">
        <div>
          <Link
            to={slug ? `/product/${slug}` : "#"}
            className="text-lg font-semibold leading-tight hover:underline"
          >
            {name}
          </Link>
          {packageSize ? (
            <div className="text-xs text-neutral-500">Size: {packageSize}</div>
          ) : null}
        </div>

        <p className="line-clamp-2 text-sm text-neutral-600">{description}</p>

        {/* Variantes */}
        {activeVariants.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-600">Size:</label>
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

        <div className="flex items-center justify-between">
          <span className="text-base font-bold">
            {showPriceText ? money.format(numericPrice) : "Request a quote"}
          </span>

          <button
            onClick={addToCart}
            className="rounded-lg border px-3 py-2 text-sm font-medium hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-50"
            disabled={outOfStock}
            aria-disabled={outOfStock}
            aria-label={outOfStock ? "Out of stock" : "Add to cart"}
            title={outOfStock ? "Out of stock" : "Add"}
          >
            {outOfStock ? "Out of stock" : "Add"}
          </button>
        </div>

        {pdfUrl ? (
          <div className="pt-1">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-700 underline decoration-dotted underline-offset-2 hover:text-emerald-800"
            >
              View datasheet (PDF)
            </a>
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}
