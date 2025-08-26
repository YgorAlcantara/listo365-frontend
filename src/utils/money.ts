// src/utils/money.ts

/** Site-wide USD formatter (single source of truth) */
export const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** Formats any value as USD (falls back to $0.00 if not a finite number) */
export function formatMoney(v: unknown): string {
  const n =
    typeof v === "number"
      ? v
      : Number(
          String(v ?? "")
            .trim()
            .replace(",", ".")
        );
  return money.format(Number.isFinite(n) ? n : 0);
}

/** Parses to number or returns null (safe for Prisma Decimal strings) */
export function toNumberOrNull(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).trim().replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Parses to number with fallback 0 */
export function toNumberOrZero(v: unknown): number {
  const n = toNumberOrNull(v);
  return n == null ? 0 : n;
}

/** Rounds to 2 decimals */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
