import { motion } from 'framer-motion';
import { useCart } from '@/components/cart/CartProvider';
import { money } from '@/components/utils';

type Props = {
  id: string;
  name: string;
  description: string;
  price: number;
  /** novo: lista de imagens (1ª = capa) */
  images?: string[];
  /** legado: capa antiga (fallback) */
  imageUrl?: string | null;
  /** novo: tamanho/embalagem, ex.: "1 gal", "32 oz" */
  packageSize?: string | null;
  /** novo: PDF 1 página (datasheet) */
  pdfUrl?: string | null;
  /** para desabilitar add quando sem estoque */
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

  // capa = primeira imagem nova, senão imageUrl legado
  const cover =
    (images && images.length > 0 ? images[0] : undefined) ??
    imageUrl ??
    'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

  const outOfStock = typeof stock === 'number' && stock <= 0;

  return (
    <motion.article
      whileHover={{ y: -2 }}
      className="group overflow-hidden rounded-2xl border bg-white shadow-sm transition"
    >
      <div
        className="relative aspect-[4/3] w-full bg-neutral-100"
        style={{
          backgroundImage: `url(${cover})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="space-y-2 p-4">
        <h3 className="text-lg font-semibold leading-tight">{name}</h3>

        {packageSize ? (
          <div className="text-xs text-neutral-500">Size: {packageSize}</div>
        ) : null}

        <p className="line-clamp-2 text-sm text-neutral-600">{description}</p>

        <div className="flex items-center justify-between">
          <span className="text-base font-bold">{money.format(price)}</span>

          <button
            onClick={() => add({ id, name, price, imageUrl: cover }, 1)}
            className="rounded-lg border px-3 py-2 text-sm font-medium hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-50"
            disabled={outOfStock}
            aria-disabled={outOfStock}
            aria-label={outOfStock ? 'Out of stock' : 'Add to cart'}
            title={outOfStock ? 'Out of stock' : 'Add'}
          >
            {outOfStock ? 'Out of stock' : 'Add'}
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
