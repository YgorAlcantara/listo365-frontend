import { motion } from "framer-motion";
import { useCart } from "@/components/cart/CartProvider";
import { money } from "@/utils/money";
import { Link } from "react-router-dom";

type Props = {
  id: string;
  slug?: string | null;
  name: string;
  description?: string;
  price?: number;            // pode vir undefined quando preço oculto
  images?: string[];
  imageUrl?: string | null;
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
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

  const outOfStock = typeof stock === "number" && stock <= 0;
  const canShowPrice = typeof price === "number" && Number.isFinite(price);

  function handleAdd() {
    // se preço oculto, adiciona com 0 (modo orçamento)
    const unitPrice = canShowPrice ? price! : 0;
    add({ id, name, price: unitPrice, imageUrl: cover }, 1);
  }

  const viewHref = `/product/${slug || id}`;

  return (
    <motion.article
      whileHover={{ y: -2 }}
      className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition"
    >
      <Link to={viewHref}>
        <div
          className="relative aspect-[4/3] w-full bg-neutral-100"
          style={{
            backgroundImage: `url(${cover})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </Link>

      <div className="space-y-2 p-4">
        <h3 className="text-lg font-semibold leading-tight">
          <Link to={viewHref} className="hover:underline">{name}</Link>
        </h3>

        {packageSize ? (
          <div className="text-xs text-neutral-500">Size: {packageSize}</div>
        ) : null}

        {description ? (
          <p className="line-clamp-2 text-sm text-neutral-600">{description}</p>
        ) : null}

        <div className="flex items-center justify-between">
          <span className="text-base font-bold">
            {canShowPrice ? money.format(price!) : "Request a quote"}
          </span>

          <button
            onClick={handleAdd}
            className="rounded-lg border px-3 py-2 text-sm font-medium hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-50"
            disabled={outOfStock}
            aria-disabled={outOfStock}
            aria-label={outOfStock ? "Out of stock" : "Add to cart"}
            title={outOfStock ? "Out of stock" : "Add"}
          >
            {outOfStock ? "Out of stock" : "Add"}
          </button>
        </div>

        <div className="flex items-center justify-between pt-1 text-xs">
          {pdfUrl ? (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 underline decoration-dotted underline-offset-2 hover:text-emerald-800"
            >
              View datasheet (PDF)
            </a>
          ) : <span />}
          <Link to={viewHref} className="text-neutral-600 hover:underline">
            View
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
