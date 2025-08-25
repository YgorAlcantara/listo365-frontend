import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { fmtMoneyUSD, toNumberOrNull } from "@/utils/money";
import { parseVariantsFromPackageSize } from "@/utils/product";

type Props = {
  id: string;
  name: string;
  description: string;
  price?: number | string | null; // fallback
  images?: string[];
  imageUrl?: string | null;
  packageSize?: string | null; // contém as variantes em JSON ou legado
  pdfUrl?: string | null;
  stock?: number;
};

export function ProductCard({
  id,
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

  const variants = useMemo(
    () => parseVariantsFromPackageSize(packageSize),
    [packageSize]
  );

  const [selIdx, setSelIdx] = useState(0);
  const sel = variants[selIdx];

  const cover =
    (images && images.length > 0 ? images[0] : undefined) ??
    imageUrl ??
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

  const outOfStock = typeof stock === "number" && stock <= 0;

  // preço efetivo = preço da variante OU preço do produto OU null
  const effPrice = toNumberOrNull(sel?.price) ?? toNumberOrNull(price) ?? null;

  function addToCart() {
    const displayName = sel?.label ? `${name} (${sel.label})` : name;
    add(
      {
        id,
        name: displayName,
        price: effPrice, // pode ser null => precisa cotação
        imageUrl: cover,
        variant: sel?.label,
        needsQuote: effPrice === null,
      },
      1
    );
  }

  return (
    <motion.article
      whileHover={{ y: -2 }}
      className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition"
    >
      <div
        className="relative aspect-[4/3] w-full bg-neutral-100"
        style={{
          backgroundImage: `url(${cover})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="space-y-2 p-4">
        <h3 className="text-lg font-semibold leading-tight">{name}</h3>

        {/* seletor de variantes */}
        {variants.length > 0 ? (
          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-600">Size:</label>
            <select
              className="rounded border px-2 py-1 text-xs"
              value={selIdx}
              onChange={(e) => setSelIdx(Number(e.target.value))}
            >
              {variants.map((v, i) => (
                <option key={`${v.label}-${i}`} value={i}>
                  {v.label}
                  {v.price != null
                    ? ` — ${fmtMoneyUSD(v.price)}`
                    : " — price on request"}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <p className="line-clamp-2 text-sm text-neutral-600">{description}</p>

        <div className="flex items-center justify-between">
          <span className="text-base font-bold">
            {effPrice === null ? "Request a quote" : fmtMoneyUSD(effPrice)}
          </span>

          <button
            onClick={addToCart}
            className="rounded-lg border px-3 py-2 text-sm font-medium hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-50"
            disabled={outOfStock}
            aria-disabled={outOfStock}
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
