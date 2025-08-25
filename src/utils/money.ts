// Formatação USD site-wide
export const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** Converte qualquer coisa em number OU null (seguro) */
export function toNumberOrNull(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).trim().replace(",", "."); // aceita vírgula decimal
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Converte para number (fallback 0) */
export function toNumberOrZero(v: unknown): number {
  const n = toNumberOrNull(v);
  return n == null ? 0 : n;
}
