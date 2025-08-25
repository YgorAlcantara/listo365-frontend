export function toNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
export function fmtMoneyUSD(v: unknown): string {
  const n = toNumberOrNull(v);
  return n === null ? "—" : `$${n.toFixed(2)}`;
}
