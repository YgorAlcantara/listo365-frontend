import { useEffect, useState } from "react";
import { api } from "@/services/api";

type Promo = { id: string; title: string };

export function PromoBar() {
  const [promo, setPromo] = useState<Promo | null>(null);

  useEffect(() => {
    let alive = true;

    // evita reexibir se o usuário já fechou na sessão
    const dismissed = sessionStorage.getItem("promo:dismissed") === "1";
    if (dismissed) return;

    api
      .get("/promotions")
      .then((r) => {
        const p = r.data?.[0];
        if (!alive) return;
        if (p?.title) setPromo({ id: p.id, title: p.title });
      })
      .catch(() => {
        /* silencioso */
      });

    return () => {
      alive = false;
    };
  }, []);

  if (!promo) return null;

  return (
    <div className="relative bg-emerald-600 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2">
        <p className="truncate text-center text-sm font-medium">
          {promo.title}
        </p>
      </div>
      <button
        onClick={() => {
          sessionStorage.setItem("promo:dismissed", "1");
          setPromo(null);
        }}
        aria-label="Dismiss promotion"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-white/10"
      >
        <span aria-hidden>✕</span>
      </button>
    </div>
  );
}
