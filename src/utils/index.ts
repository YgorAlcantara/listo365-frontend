// Re-export helpers to have a single import point: "@/utils"
export * from "./money";
export * from "./product";

// Tailwind classnames helper
export function cn(...classes: Array<string | null | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}
