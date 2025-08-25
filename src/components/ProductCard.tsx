import { motion } from 'framer-motion';
import { useCart } from '@/components/cart/CartProvider';
import { money } from '@/components/utils';
import { Link } from 'react-router-dom';

type VariantLite = { id: string; name: string; price: number; stock: number; active?: boolean; };
type Props = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  images?: string[];
  imageUrl?: string | null;
  packageSize?: string | null;
  pdfUrl?: string | null;
  stock?: number;
  visibility?: { price?: boolean };
  variants?: VariantLite[];
};

export function ProductCard({
  id, slug, name, description, price, images, imageUrl, packageSize, pdfUrl, stock, visibility, variants,
}: Props) {
  const { add } = useCart();
  const cover =
    (images && images.length > 0 ? images[0] : undefined) ??
    imageUrl ??
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

  const outOfStock = typeof stock === 'number' && stock <= 0;
  const hasVariants = (variants?.length ?? 0) > 0;
  const minPrice = hasVariants ? Math.min(...(variants || []).map(v => v.price)) : price;

  function quickAdd() {
    if (hasVariants) {
      const v = variants![0];
      const priceToStore = visibility?.price === false ? null : v.price;
      add({
        id,
        variantId: v.id,
        variantName: v.name,
        name: `${name} — ${v.name}`,
        price: priceToStore,
        imageUrl: cover,
      }, 1);
    } else {
      const priceToStore = visibility?.price === false ? null : price;
      add({ id, name, price: priceToStore, imageUrl: cover }, 1);
    }
  }

  return (
    <motion.article whileHover={{ y: -2 }} className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition">
      <div className="relative aspect-[4/3] w-full bg-neutral-100"
        style={{ backgroundImage: `url(${cover})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div className="space-y-2 p-4">
        <h3 className="text-lg font-semibold leading-tight">{name}</h3>

        {packageSize ? (
          <div className="text-xs text-neutral-500">Size: {packageSize}</div>
        ) : null}

        <p className="line-clamp-2 text-sm text-neutral-600">{description}</p>

        <div className="flex items-center justify-between">
          {visibility?.price === false ? (
            <span className="text-sm font-medium text-neutral-500">Request a quote</span>
          ) : (
            <span className="text-base font-bold">
              {hasVariants ? `From ${money.format(minPrice)}` : money.format(price)}
            </span>
          )}

          <div className="flex gap-2">
            <button
              onClick={quickAdd}
              className="rounded-lg border px-3 py-2 text-sm font-medium hover:border-orange-600 hover:text-orange-700 disabled:opacity-50"
              disabled={outOfStock}
              aria-disabled={outOfStock}
              title={outOfStock ? 'Out of stock' : 'Add'}
            >
              {outOfStock ? 'Out of stock' : 'Add'}
            </button>

            <Link
              to={`/p/${slug}`}
              className="rounded-lg border px-3 py-2 text-sm hover:border-neutral-700"
            >
              View
            </Link>
          </div>
        </div>

        {pdfUrl ? (
          <div className="pt-1">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-orange-700 underline decoration-dotted underline-offset-2 hover:text-orange-800"
            >
              View datasheet (PDF)
            </a>
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}
