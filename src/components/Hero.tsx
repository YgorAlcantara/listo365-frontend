import { CheckCircle } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white">
      {/* subtle decor */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-orange-400/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.04)_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 sm:py-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-orange-500" />
          Industrial-grade cleaning chemicals
        </div>

        <div className="mt-5 max-w-3xl">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Pro results, less hassle.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-neutral-600">
            Explore finishes, degreasers, glass cleaners and restroom care —
            with variant sizes, spec sheets and a smooth quote-first checkout.
          </p>
        </div>

        {/* actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          {/* Agora rola para a grade de produtos */}
          <a
            href="#catalog"
            className={[
              "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white",
              "bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60",
            ].join(" ")}
          >
            View products
          </a>
          <a
            href="/checkout"
            className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            Checkout
          </a>
        </div>

        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-600">
          {[
            "Quote-friendly pricing visibility",
            "Variant sizes per product",
            "Spec PDFs when available",
          ].map((t) => (
            <li key={t} className="inline-flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-orange-500" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
