export function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// Converte payload cru do backend (que traz visiblePrice, etc.) para nosso shape
export function normalizeProduct(raw: any) {
  const vis = {
    price: raw?.visiblePrice !== false, // default true quando undefined
    packageSize: raw?.visiblePackageSize !== false,
    pdf: raw?.visiblePdf !== false,
    images: raw?.visibleImages !== false,
    description: raw?.visibleDescription !== false,
  };

  // se o preço está oculto, entregue null para não dar NaN
  const basePrice = vis.price ? Number(raw?.price ?? 0) : null;

  // Prisma Decimal pode vir como string
  const safeNum = (v: any) => (v === null || v === undefined ? 0 : Number(v));

  return {
    id: String(raw.id),
    slug: String(raw.slug),
    name: String(raw.name),
    description: String(raw.description ?? ""),
    price: basePrice,
    active: !!raw.active,
    stock: Number(raw.stock ?? 0),
    sortOrder: Number(raw.sortOrder ?? 0),
    packageSize: raw.packageSize ?? null,
    pdfUrl: raw.pdfUrl ?? null,
    imageUrl: raw.imageUrl ?? null,
    images: Array.isArray(raw.images)
      ? raw.images
      : Array.isArray(raw.productImages)
      ? raw.productImages.map((i: any) => i.url)
      : [],

    category: raw.category ?? null,

    sale: raw.sale
      ? {
          title: raw.sale.title,
          percentOff: raw.sale.percentOff
            ? Number(raw.sale.percentOff)
            : undefined,
          priceOff: raw.sale.priceOff ? Number(raw.sale.priceOff) : undefined,
          startsAt: raw.sale.startsAt,
          endsAt: raw.sale.endsAt,
          salePrice: Number(raw.sale.salePrice),
        }
      : null,

    variants: Array.isArray(raw.variants)
      ? raw.variants.map((v: any) => ({
          id: String(v.id),
          name: String(v.name),
          price: Number(v.price),
        }))
      : undefined,

    visibility: vis,
  };
}
