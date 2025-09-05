// src/components/Hero.tsx
import { CheckCircle } from "lucide-react";
import heroBg from "@/assets/Banner/11.png";

export function Hero() {
  return (
    // full-bleed: ocupa 100% da janela horizontalmente
    <section className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden">
      {/* Background + overlays */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        {/* véu alaranjado da marca */}
        {/*<div className="absolute inset-0 bg-gradient-to-r from-orange-600/45 via-orange-500/35 to-orange-300/10 mix-blend-multiply" /> */}
        {/* vinheta sutil para contraste do texto */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.35),transparent_55%)]" />
      </div>

      {/* Conteúdo central com largura do site */}
      <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-20">
        {/* selo */}
        <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] font-medium text-orange-700 ring-1 ring-orange-200 backdrop-blur">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500" />
          Commercial & Industrial Cleaning
        </div>

        {/* headline + sub */}
        <div className="mt-5 max-w-3xl text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.4)]">
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
            Solutions for a Cleaner World
          </h1>
          <p className="mt-3 text-base leading-relaxed text-white/90">
            Professionally engineered chemical solutions for maintenance teams, contractors and facilities.
            Explore our catalog and request a tailored quote — quickly and confidently.
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="#catalog"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            Explore Products
          </a>
          <a
            href="/checkout"
            className="inline-flex items-center justify-center rounded-xl border border-white/70 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
          >
            Request a Quote
          </a>
        </div>

        {/* bullets */}
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90">
          {[
            "High-performance formulas",
            "Bulk sizes available",
            "Fast, friendly quotes",
          ].map((t) => (
            <li key={t} className="inline-flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-white" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* fade para integrar com fundo branco do site */}
      <div className="h-10 bg-gradient-to-b from-transparent to-white" />
    </section>
  );
}