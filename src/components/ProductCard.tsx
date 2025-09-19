import { Link } from "react-router-dom";
import type { Product } from "@/types";
import { money } from "@/utils/money";

type Props = {
  product: Product;
};

export default function ProductCard({ product }: Props) {
  const hasPrice =
    product.visibility?.price && typeof product.price === "number";
  const salePrice =
    product.sale && hasPrice ? product.sale.salePrice : undefined;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm hover:shadow-md transition">
      {/* Imagem */}
      <Link
        to={`/product/${product.slug}`}
        className="block aspect-square bg-neutral-100"
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-400">
            No image
          </div>
        )}
      </Link>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-sm text-neutral-900 line-clamp-2">
          <Link to={`/product/${product.slug}`}>{product.name}</Link>
        </h3>

        {product.visibility?.description && product.description && (
          <p className="mt-1 text-xs text-neutral-600 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between">
          {/* Preço */}
          {hasPrice ? (
            <div className="flex items-baseline gap-2">
              {salePrice ? (
                <>
                  <span className="text-sm font-semibold text-orange-600">
                    {money.format(salePrice)}
                  </span>
                  <span className="text-xs text-neutral-400 line-through">
                    {money.format(product.price!)}
                  </span>
                </>
              ) : (
                <span className="text-sm font-semibold text-neutral-900">
                  {money.format(product.price!)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm font-medium text-orange-600">
              Request a quote
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
