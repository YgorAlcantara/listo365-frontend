import { Link } from "react-router-dom";
import type { Product } from "@/types";
import { money } from "@/utils/money";

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
  // opcional vindo do backend
  sale?: Product["sale"];
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
    sale,
  } = props;

  const cover =
    (images && images.length > 0 ? images[0] : undefined) ??
    imageUrl ??
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

  const hasPrice = typeof price === "number" && Number.isFinite(price);
  const href = `/product/${encodeURIComponent(slug || id)}`;

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white",
        "transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg",
      ].join(" ")}
    >
      {/* image */}
      <Link to={href} className="block">
        <div
          className="aspect-[4/3] w-full bg-neutral-100"
          style={{
            backgroundImage: `url(${cover})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-label={name}
        />
      </Link>

      {/* content */}
      <div className="flex flex-col gap-3 p-4">
        <div className="min-h-[2.5rem]">
          <h3 className="line-clamp-2 text-sm font-semibold text-neutral-900">
            <Link to={href} className="hover:underline">
              {name}
            </Link>
          </h3>
          {packageSize ? (
            <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">
              {packageSize}
            </p>
          ) : null}
        </div>

        {/* price / quote / sale */}
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
            >
              Datasheet (PDF)
            </a>
          ) : (
            <span className="text-xs text-neutral-400">No datasheet</span>
          )}
        </div>

        {/* CTA outlined: texto laranja, fundo branco, borda laranja */}
        <div>
          <Link
            to={href}
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
