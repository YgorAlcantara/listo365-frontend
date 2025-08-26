import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useCart } from "@/components/cart/CartProvider";
import { money } from "@/utils/money";

type Props = {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  price?: number; // pode vir oculto no público
  images?: string[];
  imageUrl?: string | null; // fallback legado
  packageSize?: string | null;
  pdfUrl?: string | null;
  stock?: number;
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
}: Props) {
  const { add } = useCart();

  const cover =
    (images && images.length > 0 ? images[0] : undefined) ??
    imageUrl ??
    // 1x1 transparente (evita layout shift)
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

  const outOfStock = typeof stock === "number" && stock <= 0;
  const hasPrice = typeof price === "number" && Number.isFinite(price);
  // quando o preço estiver oculto, enviamos `undefined` -> carrinho trata como “quote required”
  const unitPrice = hasPrice ? (price as number) : undefined;

  const productHref = `/product/${encodeURIComponent(slug || id)}`;

  return (
    <motion.article
      whileHover={{ y: -2 }}
      className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition"
    >
      <Link to={productHref} className="block" aria-label={`Open ${name} page`}>
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
        <h3 className="text-lg font-semibold leading-tight line-clamp-2">
          {name}
        </h3>

        {packageSize ? (
          <div className="text-xs text-neutral-500">Size: {packageSize}</div>
        ) : null}

        {description ? (
          <p className="line-clamp-2 text-sm text-neutral-600">{description}</p>
        ) : null}

        <div className="flex items-center justify-between">
          <span className="text-base font-bold">
            {hasPrice ? (
              money.format(unitPrice!)
            ) : (
              <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[13px] font-medium text-orange-600 ring-1 ring-inset ring-orange-200">
                Request a quote
              </span>
            )}
          </span>

          <div className="flex items-center gap-2">
            {/* View — mesma linguagem visual do “Quote” (laranja) */}
            <Link
              to={productHref}
              className="rounded-lg border border-orange-600 px-3 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50"
              aria-label="View product"
              title="View"
            >
              View
            </Link>

            {/* Add to cart */}
            <button
              onClick={() =>
                add({ id, name, price: unitPrice, imageUrl: cover }, 1)
              }
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-50"
              disabled={outOfStock}
              aria-disabled={outOfStock}
              aria-label={outOfStock ? "Out of stock" : "Add to cart"}
              title={outOfStock ? "Out of stock" : "Add"}
            >
              {outOfStock ? "Out of stock" : "Add"}
            </button>
          </div>
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
