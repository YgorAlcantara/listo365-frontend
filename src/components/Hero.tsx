import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-emerald-50 to-white px-6 py-10 md:px-10">
      <div className="max-w-2xl space-y-4">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Commercial cleaning products, made simple
        </h1>
        <p className="text-neutral-700">
          Browse our catalog, request a quote in one click, and get a reply in
          under 20 minutes.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            to="/#products"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Browse products
          </Link>
          <Link
            to="/checkout"
            className="inline-flex items-center justify-center rounded-xl border border-orange-600 px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50"
          >
            Request a quote
          </Link>
        </div>
      </div>

      {/* subtle decorative blob */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl"
      />
    </section>
  );
}
