import type { Variant } from "@/types";
import { toNumberOrNull } from "./money";

/** Aceita:
 *  - JSON: `[{"label":"1 gal","price":9.99},{"label":"5 gal"}]`
 *  - Legado: "1 gal | 5 gal | 55 gal"
 */
export function parseVariantsFromPackageSize(ps?: string | null): Variant[] {
  if (!ps) return [];
  const s = ps.trim();

  // JSON?
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
      return [];
    } catch {
      // cai pro legado
    }
  }

  // Legado: "a | b | c" ou "a, b, c"
  return s
    .split(/[|,]/g)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((label) => ({ label, price: null }));
}

/** Serializa variantes em JSON pra salvar no backend dentro de packageSize */
export function variantsToPackageSizeJson(vs: Variant[]): string {
  return JSON.stringify(
    vs.map((v) => ({ label: v.label, price: v.price ?? null }))
  );
}
