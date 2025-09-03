// src/components/Hero.tsx
import { CheckCircle } from "lucide-react";
// ajuste a extensão conforme seu arquivo (png/jpg/webp)
import heroBg from "@/assets/Banner/Banner1.png";

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-neutral-200">
      {/* Background image + overlays */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* imagem */}
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        {/* véu de cor da marca (alaranjado) */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/35 via-orange-400/25 to-transparent mix-blend-multiply" />
        {/* leve vinheta para contraste */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.22),transparent_60%)]" />
        {/* fade para o conteúdo abaixo */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/90 to-transparent" />
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 sm:py-16">
        {/* selo/flag */}
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/90 px-3 py-1 text-[11px] font-medium text-orange-700 backdrop-blur">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-orange-500" />
          Professionally Engineered Chemical Solutions
        </div>

        {/* bloco de texto sobre o bg (card translúcido) */}
        <div className="mt-5 max-w-2xl rounded-2xl bg-white/75 p-5 shadow-sm ring-1 ring-white/40 backdrop-blur">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Solutions for a Cleaner World
          </h1>
          <p className="mt-3 text-base leading-relaxed text-neutral-700">
            Best providers of commercial &amp; industrial cleaning and
            maintenance products. Discover high-performance chemicals designed
            for real-world results — and request a tailored quote in seconds.
          </p>

          {/* Ações */}
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="#catalog"
              className={[
                "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm",
                "bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60",
              ].join(" ")}
            >
              Explore Products
            </a>
            <a
              href="/checkout"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
            >
              Request a Quote
            </a>
          </div>

          {/* Bullets curtos (institucionais) */}
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-700">
            {[
              "Industrial-grade quality",
              "Fast & friendly quotes",
              "Trusted by professionals",
            ].map((t) => (
              <li key={t} className="inline-flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-orange-500" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
