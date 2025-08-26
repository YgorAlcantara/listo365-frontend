import { ReactNode } from "react";
import { cn } from "@/utils";

type EmptyStateProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
};

export default function EmptyState({
  title,
  subtitle,
  action,
  className,
}: EmptyStateProps) {
  return (
    <section
      className={cn(
        "grid place-items-center rounded-2xl border bg-white p-8 text-center shadow-sm",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto max-w-md space-y-3">
        <div className="inline-flex items-center justify-center rounded-xl bg-emerald-50 px-3 py-1 text-emerald-700 ring-1 ring-emerald-100">
          <span className="text-xs font-semibold tracking-wide">Listo365</span>
        </div>

        <h3 className="text-lg font-semibold">{title}</h3>

        {subtitle && (
          <p className="text-sm leading-relaxed text-neutral-600">{subtitle}</p>
        )}

        {action && <div className="pt-2">{action}</div>}
      </div>
    </section>
  );
}
