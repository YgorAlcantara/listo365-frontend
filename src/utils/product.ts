// src/utils/product.ts
import type { Product, ProductVariant, Variant } from "@/types";
import { toNumberOrNull, toNumberOrZero } from "./money";

/**
 * Normalizes a raw product (from API/Prisma) to our `Product` UI shape.
 * - Handles Prisma Decimal (string) -> number
 * - Applies visibility flags when present
 * - Works with either `images: string[]` OR `{ images: [{url}] }`
 * - Accepts `category` already flattened OR `categories[0].category`
 */
export function normalizeProduct(raw: any): Product {
  // Visibility flags — prefer `visibility` from API; fallback to columns
  const vis = {
    price: raw?.visibility?.price ?? raw?.visiblePrice ?? false, // default false on schema
    packageSize:
      raw?.visibility?.packageSize ?? raw?.visiblePackageSize ?? true,
    pdf: raw?.visibility?.pdf ?? raw?.visiblePdf ?? true,
    images: raw?.visibility?.images ?? raw?.visibleImages ?? true,
    description:
      raw?.visibility?.description ?? raw?.visibleDescription ?? true,
  };

  const price = vis.price ? toNumberOrNull(raw?.price) ?? undefined : undefined;

  // images: prefer array of strings; else map from { url }
  const imagesArr: string[] = Array.isArray(raw?.images)
    ? raw.images.map((x: any) => String(x?.url ?? x)).filter(Boolean)
    : Array.isArray(raw?.productImages)
    ? raw.productImages.map((i: any) => String(i.url)).filter(Boolean)
    : [];

  // category: accept already flattened OR categories[0].category
  const catSrc = raw?.category ?? raw?.categories?.[0]?.category ?? null;
  const category = catSrc
    ? {
        id: String(catSrc.id),
        name: String(catSrc.name),
        slug: String(catSrc.slug),
        parent: catSrc.parent
          ? {
              id: String(catSrc.parent.id),
              name: String(catSrc.parent.name),
              slug: String(catSrc.parent.slug),
            }
          : null,
      }
    : null;

  // sale (if API already computed) — coerce numbers safely
  const sale = raw?.sale
    ? {
        title: raw.sale.title,
        percentOff: toNumberOrNull(raw.sale.percentOff) ?? undefined,
        priceOff: toNumberOrNull(raw.sale.priceOff) ?? undefined,
        startsAt: raw.sale.startsAt,
        endsAt: raw.sale.endsAt,
        salePrice: toNumberOrZero(raw.sale.salePrice),
      }
    : null;

  // variants (optional)
  const variants: ProductVariant[] | undefined = Array.isArray(raw?.variants)
    ? raw.variants.map((v: any) => ({
        id: String(v.id),
        name: String(v.name),
        // hide price when visibility.price = false
        price: vis.price ? toNumberOrNull(v.price) ?? undefined : undefined,
        stock: toNumberOrZero(v.stock),
        active: !!v.active,
        sortOrder: toNumberOrZero(v.sortOrder),
        sku: v.sku ?? undefined,
      }))
    : undefined;

  return {
    id: String(raw.id),
    slug: String(raw.slug ?? raw.id),
    name: String(raw.name),
    description: vis.description ? String(raw.description ?? "") : undefined,
    price,
    active: !!raw.active,
    stock: toNumberOrZero(raw.stock),
    sortOrder: toNumberOrZero(raw.sortOrder),
    packageSize: vis.packageSize ? raw.packageSize ?? null : undefined,
    pdfUrl: vis.pdf ? raw.pdfUrl ?? null : undefined,
    imageUrl: vis.images ? raw.imageUrl ?? null : null,
    images: vis.images ? imagesArr : [],
    category,
    sale,
    variants,
    visibility: vis,
  };
}

/**
 * Parses variants encoded inside `packageSize` (legacy support).
 * Accepts:
 *  - JSON: `[{"label":"1 gal","price":9.99},{"label":"5 gal"}]`
 *  - Legacy text: "1 gal | 5 gal | 55 gal" (comma also works)
 */
export function parseVariantsFromPackageSize(ps?: string | null): Variant[] {
  if (!ps) return [];
  const s = ps.trim();

  // JSON array?
  if (s.startsWith("[") || s.startsWith("{")) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        return parsed
          .map((x) => ({
            label: String(x.label ?? x.size ?? "").trim(),
            price: toNumberOrNull(x.price),
          }))
          .filter((v) => v.label);
      }
    } catch {
      /* fall through to legacy */
    }
  }

  // Legacy: "a | b | c" or "a, b, c"
  return s
    .split(/[|,]/g)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((label) => ({ label, price: null }));
}

/** Serializes variants back to JSON for storing in `packageSize` */
export function variantsToPackageSizeJson(vs: Variant[]): string {
  return JSON.stringify(
    vs.map((v) => ({ label: v.label, price: v.price ?? null }))
  );
}
