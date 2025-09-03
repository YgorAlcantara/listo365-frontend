import { Link } from "react-router-dom";
import type { Product } from "@/types";
import { money } from "@/utils/money";
import { prefetchProduct } from "@/services/productCache";

// Categoria mínima para o card (compatível com preview do ProductPage)
type CardCategory =
  | { name: string; parent?: { name: string } | null }
  | null
  | undefined;

type Props = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price?: number;
  images: string[];
  imageUrl?: string | null;
  packageSize?: string | null;
  pdfUrl?: string | null;
  stock: number;
  sale?: Product["sale"];

  // ✅ Acrescentados (opcionais)
  sku?: string | null;
  category?: CardCategory;
  // (alternativa caso prefira mandar só strings)
  categoryName?: string | null;
  categoryParentName?: string | null;
};

export function ProductCard(props: Props) {
  const {
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
    sale,

    // novos
    sku,
    category,
    categoryName,
    categoryParentName,
  } = props;

  const key = slug || id;

  const cover =
    (images && images.length > 0 ? images[0] : undefined) ??
    imageUrl ??
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

  const hasPrice = typeof price === "number" && Number.isFinite(price);
  const href = `/product/${encodeURIComponent(key)}`;

  // Monta rótulo de categoria (aceita objeto OU strings)
  const catObj: CardCategory =
    category ??
    (categoryName
      ? {
          name: categoryName,
          parent: categoryParentName ? { name: categoryParentName } : null,
        }
      : null);

  const categoryLabel = catObj?.name
    ? `${catObj?.parent?.name ? `${catObj.parent.name} › ` : ""}${catObj.name}`
    : null;

  // Preview leve para abrir a página de produto instantânea
  const preview: Partial<Product> = {
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
    sale: sale ?? undefined,
    category: catObj as any, // usado pelo breadcrumb / infos
  };

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white",
        "transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg",
      ].join(" ")}
      onMouseEnter={() => prefetchProduct(key)}
      onTouchStart={() => prefetchProduct(key)}
    >
      {/* imagem (sem cortes, igual ao ProductPage) */}
      <Link to={href} state={{ preview }} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-white">
          <img
            src={cover}
            alt={name}
            className="absolute inset-0 h-full w-full object-contain p-3"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          {sale?.salePrice ? (
            <span className="absolute left-3 top-3 rounded-full bg-orange-600/95 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
              {sale.percentOff ? `${sale.percentOff}% off` : "On sale"}
            </span>
          ) : null}
        </div>
      </Link>

      {/* conteúdo */}
      <div className="flex flex-col gap-3 p-4">
        {/* título */}
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold text-neutral-900">
            <Link to={href} state={{ preview }} className="hover:underline">
              {name}
            </Link>
          </h3>

          {/* categoria + subcategoria */}
          {categoryLabel ? (
            <div className="mt-1 text-[12px] text-neutral-500">
              {categoryLabel}
            </div>
          ) : null}

          {/* metadados compactos: package size / SKU */}
          {(packageSize || sku) && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-neutral-600">
              {packageSize ? (
                <span className="line-clamp-1">{packageSize}</span>
              ) : null}
              {sku ? <span className="line-clamp-1">SKU: {sku}</span> : null}
            </div>
          )}
        </div>

        {/* preço / quote / pdf */}
        <div className="flex items-center justify-between">
          {hasPrice ? (
            sale?.salePrice ? (
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-bold text-orange-600">
                  {money.format(sale.salePrice)}
                </span>
                <span className="text-xs text-neutral-500 line-through">
                  {money.format(price as number)}
                </span>
              </div>
            ) : (
              <div className="text-sm font-semibold text-neutral-900">
                {money.format(price as number)}
              </div>
            )
          ) : (
            <div className="text-sm font-medium text-neutral-600">
              Request a quote
            </div>
          )}

          {pdfUrl ? (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-orange-600 underline decoration-dotted underline-offset-2 hover:text-orange-700"
              onClick={(e) => e.stopPropagation()}
            >
              Datasheet (PDF)
            </a>
          ) : (
            <span className="text-xs text-neutral-400">No datasheet</span>
          )}
        </div>

        {/* CTA */}
        <div>
          <Link
            to={href}
            state={{ preview }}
            className={[
              "inline-flex w-full items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold",
              "border-orange-500 text-orange-600 bg-white",
              "hover:bg-orange-500 hover:text-white",
              "transition-colors",
            ].join(" ")}
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
